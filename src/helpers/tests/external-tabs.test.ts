/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import * as shell from '@zextras/carbonio-shell-ui';

import { mockWindowLocation } from '../../carbonio-ui-commons/test/mocks/utils/window';
import {
	isStandalonePreview,
	openConversationStandalonePreview,
	openEmlStandalonePreview,
	openMessageStandalonePreview
} from '../external-tabs';

describe('External tabs', () => {
	describe('isStandalonePreview', () => {
		it('Should return true if the focus-mode is active and the location url matches the preview url pattern', () => {
			jest.mocked(shell).IS_FOCUS_MODE = true;

			mockWindowLocation({
				origin: 'http://localhost',
				pathname: `/carbonio/focus-mode/external-view/folder/${faker.number.int()}/message/${faker.number.int()}`
			});

			expect(isStandalonePreview()).toBe(true);
		});

		it("should return false if the focus-mode is active and the location url doesn't match the preview url pattern", () => {
			jest.mocked(shell).IS_FOCUS_MODE = true;

			mockWindowLocation({
				origin: 'http://localhost',
				pathname: `/carbonio/focus-mode/other-route`
			});

			expect(isStandalonePreview()).toBe(false);
		});

		it('should return false if the focus-mode is not active', () => {
			jest.mocked(shell).IS_FOCUS_MODE = false;

			mockWindowLocation({
				origin: 'http://localhost',
				pathname: `/carbonio/focus-mode/external-view/folder/${faker.number.int()}/message/${faker.number.int()}`
			});

			expect(isStandalonePreview()).toBe(false);
		});
	});

	describe('openMessageStandalonePreview', () => {
		it('should invoke the window.open function with the correct url and title', () => {
			const folderId = faker.string.uuid();
			const messageId = faker.string.uuid();
			const subject = faker.lorem.sentence();

			openMessageStandalonePreview({ folderId, messageId, subject });

			expect(window.open).toHaveBeenCalledWith(
				`http://localhost/carbonio/focus-mode/external-view/folder/${folderId}/message/${messageId}`,
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
				`http://localhost/carbonio/focus-mode/external-view/folder/${folderId}/conversation/${conversationId}`,
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
				`http://localhost/carbonio/focus-mode/external-view/eml/${messageId}/${part}`,
				subject
			);
		});
	});
});
