/** @format */
import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import WaveSurfer from "wavesurfer.js";

import { useAudioPlayback } from "../../../utils/store/audioPlayback";

import "./audioPlayer.module.scss";
import { MdiPlay } from "../../icons/mdiPlay";
import { MdiPause } from "../../icons/mdiPause";
import { AnimatePresence } from "framer-motion";

import { getRuntimeMusic, secToTicks } from "../../../utils/date/time";
import { MdiSkipNext } from "../../icons/mdiSkipNext";
import { MdiSkipPrevious } from "../../icons/mdiSkipPrevious";
import { useQuery } from "@tanstack/react-query";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { MdiClose } from "../../icons/mdiClose";
import { MdiMusic } from "../../icons/mdiMusic";

import { theme } from "../../../theme";

const AudioPlayer = () => {
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const waveSurferRef = useRef(null);
	const waveSurferContainerRef = useRef(null);
	const [playerReady, setPlayerReady] = useState(false);
	const [playing, setPlaying] = useState(true);

	const [loading, setLoading] = useState(true);

	const [showWaveform, setShowWaveform] = useState(false);

	const [currentTime, setCurrentTime] = useState(0);

	const [
		url,
		display,
		item,
		tracks,
		currentTrack,
		setCurrentTrack,
		setAudioUrl,
		setAudioDisplay,
		setAudioItem,
		setAudioTracks,
		resetPlayer,
	] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
		state.tracks,
		state.currentTrack,
		state.setCurrentTrack,
		state.setUrl,
		state.setDisplay,
		state.setItem,
		state.setTracks,
		state.reset,
	]);

	useEffect(() => {
		if (display) {
			const waveSurfer = WaveSurfer.create({
				container: waveSurferContainerRef.current,
				barHeight: 0.8,
				dragToSeek: true,
				height: 35,
				cursorColor: "#fb2376",
				progressColor: "#fb2376",
				waveColor: "#ffffff2f",
				normalize: true,
			});
			waveSurfer.load(url);
			waveSurfer.on("load", () => {
				setLoading(true);
			});
			waveSurfer.on("ready", () => {
				waveSurferRef.current = waveSurfer;
				waveSurfer.play();
				setLoading(false);
			});
			waveSurfer.on("timeupdate", (e) => {
				setCurrentTime(e);
			});
			waveSurfer.on("redraw", () => {
				setShowWaveform(true);
			});
			waveSurfer.on("play", () => {
				setPlaying(true);
			});
			waveSurfer.on("pause", () => {
				setPlaying(false);
			});
			waveSurfer.on("finish", () => {
				setPlaying(false);
				if (currentTrack != tracks.length - 1) {
					setCurrentTrack(currentTrack + 1);
					setAudioUrl(
						`${window.api.basePath}/Audio/${
							tracks[currentTrack + 1].Id
						}/universal?deviceId=${
							window.api.deviceInfo.id
						}&userId=${user.data.Id}&api_key=${
							window.api.accessToken
						}`,
					);
					setAudioItem(tracks[currentTrack + 1]);
					setShowWaveform(false);
				}
			});
			waveSurfer.on("destroy", () => {
				waveSurfer.unAll();
				setLoading(true);
			});

			return () => {
				waveSurfer.destroy();
			};
		}
	}, [url, display, currentTrack]);

	useEffect(() => {
		if (playerReady) waveSurferRef.current.play();
	}, [playerReady]);

	const handlePlayPause = () => {
		waveSurferRef.current.playPause();
	};

	const handleNext = () => {
		setPlaying(false);
		setCurrentTrack(currentTrack + 1);
		setAudioUrl(
			`${window.api.basePath}/Audio/${
				tracks[currentTrack + 1].Id
			}/universal?deviceId=${window.api.deviceInfo.id}&userId=${
				user.data.Id
			}&api_key=${window.api.accessToken}`,
		);
		setAudioItem(tracks[currentTrack + 1]);
		setShowWaveform(false);
	};

	const handlePrevious = () => {
		setPlaying(false);
		setCurrentTrack(currentTrack - 1);
		setAudioUrl(
			`${window.api.basePath}/Audio/${
				tracks[currentTrack - 1].Id
			}/universal?deviceId=${window.api.deviceInfo.id}&userId=${
				user.data.Id
			}&api_key=${window.api.accessToken}`,
		);
		setAudioItem(tracks[currentTrack - 1]);
		setShowWaveform(false);
	};

	return (
		<AnimatePresence wait>
			{display && (
				<motion.div
					initial={{
						transform: "translateY(100%)",
					}}
					animate={{ transform: "translateY(0)" }}
					exit={{
						transform: "translateY(100%)",
					}}
					style={{
						width: `calc(100vw - ${theme.spacing(
							13,
						)} - 10px)`,
					}}
					className="audio-player"
				>
					<motion.div
						key={item.Id}
						initial={{
							filter: "opacity(0)",
						}}
						animate={{
							filter: "opacity(1)",
						}}
						exit={{
							filter: "opacity(0)",
						}}
						className="audio-player-info"
					>
						<div className="audio-player-image-container">
							<img
								className="audio-player-image"
								src={window.api.getItemImageUrl(
									Object.keys(item.ImageTags)
										.length == 0
										? item.AlbumId
										: item.Id,
									"Primary",
									{
										quality: 85,
										fillHeight: 462,
										fillWidth: 462,
									},
								)}
							/>
							<MdiMusic className="audio-player-image-icon" />
						</div>
						<div className="audio-player-info-text">
							<Typography
								variant="subtitle1"
								style={{
									width: "100%",
								}}
								fontWeight={500}
							>
								{!!item.IndexNumber
									? `${item.IndexNumber}. ${item.Name}`
									: item.Name}
							</Typography>
							<Typography
								variant="subtitle2"
								style={{
									opacity: 0.5,
								}}
								noWrap
								fontWeight={400}
							>
								by{" "}
								{item.Artists.map(
									(artist) => artist,
								).join(",")}
							</Typography>
						</div>
					</motion.div>
					<div className="audio-player-controls">
						<div style={{ display: "flex", gap: "1em" }}>
							<IconButton
								onClick={handlePrevious}
								disabled={currentTrack == 0}
							>
								<MdiSkipPrevious />
							</IconButton>
							<div
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									position: "relative",
								}}
							>
								<CircularProgress
									size={48}
									style={{
										position: "absolute",
										zIndex: 1,
										opacity: loading ? 1 : 0,
										transition: "opacity 500ms",
									}}
								/>
								<Fab
									size="small"
									onClick={handlePlayPause}
								>
									{playing ? (
										<MdiPause />
									) : (
										<MdiPlay />
									)}
								</Fab>
							</div>
							<IconButton
								onClick={handleNext}
								disabled={
									tracks.length - 1 == currentTrack
								}
							>
								<MdiSkipNext />
							</IconButton>
						</div>
						<div
							style={{
								width: "100%",
								display: "flex",
								gap: "1em",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography
								variant="subtitle2"
								fontWeight={300}
								style={{
									opacity: 0.8,
								}}
							>
								{getRuntimeMusic(
									secToTicks(currentTime),
								)}
							</Typography>
							<div
								id="waveform"
								style={{
									opacity: showWaveform ? 1 : 0,
									transition: "opacity 250ms",
								}}
								ref={waveSurferContainerRef}
							></div>
							<Typography
								variant="subtitle2"
								fontWeight={300}
								style={{
									opacity: 0.8,
								}}
							>
								{getRuntimeMusic(item.RunTimeTicks)}
							</Typography>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
						}}
					>
						<IconButton onClick={resetPlayer}>
							<MdiClose />
						</IconButton>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AudioPlayer;