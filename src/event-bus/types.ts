import { DraftTrashedEvent } from './events/draft-trashed';
import { QuotaChangedEvent } from './events/quota-changed';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type DraftTrashedEventPayload = {
	draftId: string;
};

export interface EventsBusEventsMap {
	[DraftTrashedEvent.EventName]: DraftTrashedEvent;
	[QuotaChangedEvent.EventName]: QuotaChangedEvent;
}

export type EventsBusEventsName = keyof EventsBusEventsMap;
export type EventsBusEvents = EventsBusEventsMap[keyof EventsBusEventsMap];

// Utility type to extract the payload (detail) type from a CustomEvent
export type CustomEventPayload<T> = T extends CustomEvent<infer D> ? D : never;

// Union of all possible payloads (detail types) from EventsBusEventsMap
export type EventsBusEventsPayload = CustomEventPayload<EventsBusEvents>;
