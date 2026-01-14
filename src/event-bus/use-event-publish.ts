/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { EventsBusEvents } from './types';

type EventsBusPublisher = (event: EventsBusEvents) => void;

/**
 * Provides a function to publish events to the event bus.
 * @returns A function that publishes an event to the event bus.
 */
export const useEventPublish = (): EventsBusPublisher =>
	useCallback((event: EventsBusEvents): void => {
		const customEvent = new CustomEvent(event.type, { detail: event.detail });
		window.dispatchEvent(customEvent);
	}, []);
