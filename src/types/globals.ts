/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventsBusEventsMap } from '../event-bus/types';

// Global variables injected by webpack DefinePlugin
declare global {
	const BASE_PATH: string;

	// Extend WindowEventMap with custom mail events
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface WindowEventsMap extends WindowEventMap, EventsBusEventsMap {}
}
