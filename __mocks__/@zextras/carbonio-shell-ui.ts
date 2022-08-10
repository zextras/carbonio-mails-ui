/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const soapFetchMock = (req: Record<string, unknown>): Promise<Record<string, unknown>> =>
	Promise.resolve(req);

export const soapFetch = jest.fn(soapFetchMock);
