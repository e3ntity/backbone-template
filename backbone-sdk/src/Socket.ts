/**
 * Define socket.io interface
 *
 * Fill out eventParams and eventReturns_ with the client and server events, respectively
 */

import APIError from "@root/APIError";
import { Socket } from "socket.io-client";
import z from "zod";

const eventParams = {
  // "event-name": z.tuple([z.object({})]),
};

export const eventReturns_ = {
  // "event-name": z.tuple([z.object({})]),
};

type ErrorEventKeys = `${keyof typeof eventParams}:error`;
const eventErrorReturns: Record<ErrorEventKeys, z.ZodTuple<[typeof APIError.responseSchema]>> = Object.fromEntries(
  Object.keys(eventParams).map((k) => [`${k}:error`, z.tuple([APIError.responseSchema])])
) as Record<ErrorEventKeys, z.ZodTuple<[typeof APIError.responseSchema]>>;

export const eventReturns = { ...eventReturns_, ...eventErrorReturns };

export type EventParams = {
  [K in keyof typeof eventParams]: z.infer<(typeof eventParams)[K]>;
};

// Taken from socket.d.ts
interface SocketReservedEventReturns {
  connect: [];
  connect_error: [{ err: Error }];
  disconnect: [{ reason: Socket.DisconnectReason; description?: any }];
}

export type EventReturns = SocketReservedEventReturns & {
  [K in keyof typeof eventReturns]: z.infer<(typeof eventReturns)[K]>;
};

export type ClientEvent = keyof EventReturns;
export type ServerEvent = keyof EventParams;

// Events received by the client
export type ClientEventHandlers = {
  [K in keyof EventReturns]: (...params: EventReturns[K]) => void;
};

// Events received by the server
export type ServerEventHandlers = {
  [K in keyof EventParams]: (...params: EventParams[K]) => void;
};

export class SocketWrapper {
  private socket: Socket<ClientEventHandlers, ServerEventHandlers>;
  private listenerMap: Map<string, Map<Function, Function>> = new Map();

  constructor(socket: Socket<ClientEventHandlers, ServerEventHandlers>) {
    this.socket = socket;
  }

  get wrappedSocket() {
    return this.socket;
  }

  public disconnect(): this {
    this.socket.disconnect();

    return this;
  }

  /**
   * Emit an event to the server with validation
   * @param event Event name
   * @param params Data to emit
   */
  public emit<Ev extends keyof ServerEventHandlers>(event: Ev, ...params: EventParams[Ev]): this {
    const schema: z.ZodTuple<any, any> = eventParams[event as keyof typeof eventParams] ?? z.any();
    const data = schema.parse(params);

    (this.socket.emit as any)(event, ...data);

    return this;
  }

  /**
   * Remove a specific event listener
   * @param event Event name
   * @param listener Event handler to remove
   */
  public off<Ev extends keyof ClientEventHandlers>(event: Ev, listener: ClientEventHandlers[Ev]): this {
    const hooks = this.listenerMap.get(event as string);
    if (!hooks) return this;

    const hook = hooks.get(listener);
    if (hook) {
      this.socket.off(event, hook as any); // socket.io typescript annotations are horrific
      hooks.delete(listener);
    }

    if (hooks.size === 0) this.listenerMap.delete(event as string);

    return this;
  }

  /**
   * Register an event listener with preprocessing (e.g., parsing dates)
   * @param event Event name
   * @param listener Event handler
   */
  public on<Ev extends keyof ClientEventHandlers>(event: Ev, listener: ClientEventHandlers[Ev]): this {
    const schema: z.ZodTuple<any, any> = eventReturns[event as keyof typeof eventReturns] ?? z.any();
    const hook = (...params: EventReturns[Ev]) => listener(...(schema.parse(params) as EventReturns[Ev]));

    if (!this.listenerMap.has(event as string)) this.listenerMap.set(event as string, new Map());
    this.listenerMap.get(event as string)?.set(listener, hook);

    this.socket.on<Ev>(event, hook as any); // socket.io typescript annotations are horrific

    return this;
  }
}
