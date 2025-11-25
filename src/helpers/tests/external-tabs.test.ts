/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import * as shell from '@zextras/carbonio-shell-ui';

import { FOCUS_MODE_MAIL_VIEW_ROUTE } from 'constants/index';
import {
	isFocusModeMailView,
	openConversationStandalonePreview,
	openEmlStandalonePreview,
	openMessageStandalonePreview
} from 'helpers/external-tabs';

describe('External tabs', () => {
	describe('isStandalonePreview', () => {
		it('Should return true if the focus-mode is active and the location url matches the preview url pattern', () => {
			vi.mocked(shell).IS_FOCUS_MODE = true;

			expect(isFocusModeMailView()).toBe(true);
		});

		it('should return false if the focus-mode is not active', () => {
			vi.mocked(shell).IS_FOCUS_MODE = false;

			expect(isFocusModeMailView()).toBe(false);
		});
	});

	describe('openMessageStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const messageId = faker.string.uuid();

			openMessageStandalonePreview({ folderId, messageId });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/message/${messageId}`
			);
		});
	});

	describe('openConversationStandalonePreview', () => {
		it('should invoke the window.open function with the correct url', () => {
			const folderId = faker.string.uuid();
			const conversationId = faker.string.uuid();

			openConversationStandalonePreview({ folderId, conversationId });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`
			);
		});
	});

	describe('openEmlStandalonePreview', () => {
		it('should invoke the window.open function with the correct url', () => {
			const messageId = faker.string.uuid();
			const part = faker.string.uuid();

			openEmlStandalonePreview({ messageId, part });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/${FOCUS_MODE_MAIL_VIEW_ROUTE}/eml/${messageId}/${part}`
			);
		});
	});
});
