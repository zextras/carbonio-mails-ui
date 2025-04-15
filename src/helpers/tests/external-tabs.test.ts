/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import * as shell from '@zextras/carbonio-shell-ui';

import { FOCUS_MODE_MAIL_VIEW_ROUTE } from '../../constants';
import {
	isFocusModeMailView,
	openConversationStandalonePreview,
	openEmlStandalonePreview,
	openMessageStandalonePreview
} from '../external-tabs';

describe('External tabs', () => {
	describe('isStandalonePreview', () => {
		it('Should return true if the focus-mode is active and the location url matches the preview url pattern', () => {
			jest.mocked(shell).IS_FOCUS_MODE = true;

			expect(isFocusModeMailView()).toBe(true);
		});

		it('should return false if the focus-mode is not active', () => {
			jest.mocked(shell).IS_FOCUS_MODE = false;

			expect(isFocusModeMailView()).toBe(false);
		});
	});

	describe('openMessageStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const messageId = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openMessageStandalonePreview({ folderId, messageId, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/message/${messageId}`,
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
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`,
				subject
			);
		});
	});

	describe('openEmlStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const messageId = faker.string.uuid();
			const part = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openEmlStandalonePreview({ messageId, part, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/eml/${messageId}/${part}`,
				subject
			);
		});
	});
});
