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
	secondsDelay: number;
	onTick?: (count: number, cancel: () => void) => void;
	onCancel?: () => void;
};

export type CancelableTimer = {
	promise: Promise<void>;
	cancel: () => void;
};

/**
 *
 * @param secondsDelay
 * @param onTick
 * @param onCancel
 */
export const createCancelableTimer = ({
	secondsDelay,
	onTick,
	onCancel
}: CancelableTimerParams): CancelableTimer => {
	let intervalId: ReturnType<typeof setInterval> | null;
	let countdown = secondsDelay;

	const cancel = (): void => {
		if (!intervalId) {
			return;
		}
		clearInterval(intervalId);
		intervalId = null;
		onCancel && onCancel();
	};

	const promise = new Promise<void>((resolve) => {
		if (secondsDelay <= 0) {
			resolve();
			return;
		}

		intervalId = setInterval(() => {
			if (countdown > 0) {
				countdown -= 1;
				onTick && onTick(countdown, cancel);
			} else {
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
