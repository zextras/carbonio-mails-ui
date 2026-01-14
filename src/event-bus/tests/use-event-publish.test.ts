import { faker } from '@faker-js/faker';

import { setupHook } from '../../__test__/test-setup';
import { DraftTrashedEvent } from '../events/draft-trashed';
import { useEventPublish } from '../use-event-publish';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('useEventPublish', () => {
	it('should publish events correctly', () => {
		const eventListener = vi.fn();
		const event = new DraftTrashedEvent(faker.number.int().toString());
		window.addEventListener(event.type, eventListener);

		const {
			result: { current: publishEvent }
		} = setupHook(useEventPublish);
		publishEvent(event);

		expect(eventListener).toHaveBeenCalledWith(event);

		// Cleanup
		window.removeEventListener(event.type, eventListener);
	});
});
