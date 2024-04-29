/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const undeleteAPI = (startDate: string, endDate: string): Promise<Response> =>
	fetch(`/zx/backup/v1/undelete?start=${startDate}&end=${endDate}`, {
		method: 'POST',
		credentials: 'same-origin'
	});
