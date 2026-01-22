/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import { setupHook } from '../../__test__/test-setup';
import { DraftTrashedEvent } from '../events/draft-trashed';
import { useEventSubscribe } from '../use-event-subscribe';

describe('useEventSubscribe', () => {
	it('should subscribe and unsubscribe to events correctly', () => {
		const eventListener = vi.fn();
		const event = new DraftTrashedEvent(faker.number.int().toString());

		const {
			result: { current: subscribeToEvent }
		} = setupHook(useEventSubscribe);

		subscribeToEvent(DraftTrashedEvent.EventName, eventListener);
		window.dispatchEvent(event);

		expect(eventListener).toHaveBeenCalledWith(event.detail);
	});
});
