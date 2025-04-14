/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import {
	openConversationStandalonePreview,
	openEmlStandalonePreview,
	openMessageStandalonePreview
} from '../external-tabs';

describe('External tabs', () => {
	describe('openMessageStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const messageId = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openMessageStandalonePreview({ folderId, messageId, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/msg-preview/folder/${folderId}/message/${messageId}`,
				subject
			);
		});
	});

	describe('openConversationStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const conversationId = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openConversationStandalonePreview({ folderId, conversationId, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/msg-preview/folder/${folderId}/conversation/${conversationId}`,
				subject
			);
		});
	});

	describe('openEmlStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const messageId = faker.string.uuid();
			const part = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openEmlStandalonePreview({ folderId, messageId, part, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/msg-preview/folder/${folderId}/message/${messageId}/${part}`,
				subject
			);
		});
	});
});
