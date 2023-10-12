/** @format */
import { create } from "zustand";
import { Api, Jellyfin } from "@jellyfin/sdk";
import { version as appVer } from "../../../package.json";

// Initial custom axios client to use tauri's http module
import axios from "axios";
import axiosTauriApiAdapter from "axios-tauri-api-adapter";
import { v4 as uuidv4 } from "uuid";

export const axiosClient = axios.create({
	adapter: axiosTauriApiAdapter,
	headers: { "Access-Control-Allow-Origin": "*" },
	timeout: 60000,
});

const deviceId = localStorage.getItem("deviceId");

if (!deviceId) {
	localStorage.setItem("deviceId", uuidv4());
}

// event.on("create-jellyfin-api", (serverAddress) => {
// 	window.api = ;
// 	// window.api = jellyfin.createApi(serverAddress);
// });
// event.on("set-api-accessToken", (serverAddress) => {
// 	window.api = jellyfin.createApi(
// 		serverAddress,
// 		sessionStorage.getItem("accessToken"),
// 		axiosClient,
// 	);
// // });

const jellyfin = new Jellyfin({
	clientInfo: {
		name: "JellyPlayer",
		version: appVer,
	},
	deviceInfo: {
		name: "JellyPlayer",
		id: deviceId,
	},
});

/**
 * @typedef {import("@jellyfin/sdk").Api} Api
 */

export const useApi = create((set) => ({
	/**
	 * @type {Api}
	 */
	api: null,
	deviceId: localStorage.getItem("deviceId"),
	jellyfin: jellyfin,
	createApi: (serverAddress, accessToken) =>
		set((state) => ({
			...state,
			api: jellyfin.createApi(serverAddress, accessToken, axiosClient),
		})),
}));