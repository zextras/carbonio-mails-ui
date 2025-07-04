/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockWindowLocation = (location: Partial<Location>): void => {
	Object.defineProperty(window, 'location', {
		value: {
			...window.location,
			...location
		},
		writable: true
	});
};
