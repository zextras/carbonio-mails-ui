/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Delay (in ms) between the timer ticks
 */
const TICK_DELAY_TIME = 1000;

export type CancelableTimerParams = {
	delay: number;
	onTick?: (count: number, cancel: () => void) => void;
	onCancel?: () => void;
};

export type CancelableTimer = {
	promise: Promise<void>;
	cancel: () => void;
};

/**
 *
 * @param delay
 * @param onTick
 */
export const createCancelableTimer = ({
	delay,
	onTick,
	onCancel
}: CancelableTimerParams): CancelableTimer => {
	let intervalId: ReturnType<typeof setInterval> | null;
	let countdown = delay;

	const cancel = (): void => {
		if (!intervalId) {
			return;
		}
		clearInterval(intervalId);
		intervalId = null;
		onCancel && onCancel();
	};

	const promise = new Promise<void>((resolve) => {
		intervalId = setInterval(() => {
			countdown -= 1;
			onTick && onTick(countdown, cancel);
			if (countdown === 0) {
				intervalId && clearInterval(intervalId);
				resolve();
			}
		}, TICK_DELAY_TIME);
	});
	return {
		promise,
		cancel
	};
};
