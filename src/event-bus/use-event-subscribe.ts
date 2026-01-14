import { useCallback } from 'react';

import { EventsBusEvents, EventsBusEventsName, EventsBusEventsPayload } from './types';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type EventsBusSubscriber = (
	eventType: EventsBusEventsName,
	listener: (payload: EventsBusEventsPayload) => void
) => void;

export const useEventSubscribe = (): EventsBusSubscriber =>
	useCallback<EventsBusSubscriber>((eventType, listener) => {
		const eventHandler = (event: EventsBusEvents): void => {
			listener((event as EventsBusEvents).detail);
		};

		window.addEventListener(eventType, eventHandler as EventListener);
		return () => {
			window.removeEventListener(eventType, eventHandler as EventListener);
		};
	}, []);
