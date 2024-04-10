/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const isFulfilled = (
	promise: PromiseSettledResult<unknown>
): promise is PromiseFulfilledResult<unknown> => promise.status === 'fulfilled';

export const isRejected = (
	promise: PromiseSettledResult<unknown>
): promise is PromiseRejectedResult => promise.status === 'rejected';
