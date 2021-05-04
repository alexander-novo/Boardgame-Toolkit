import { InjectionToken } from "@angular/core";
import { Socket } from "socket.io-client";

export const LOBBY_SOCKET = new InjectionToken<Socket>('LOBBY_SOCKET');