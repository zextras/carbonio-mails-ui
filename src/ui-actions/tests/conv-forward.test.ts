/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import { addBoard } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { ASSERTION, FOLDERS_DESCRIPTORS } from '../../tests/constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { ConvForwardUIAction, useUIActionConvForward } from '../conv-forward';

describe('useUIActionConvForward', () => {
	it('should return an object with specific data', () => {
		const { result: hookResult } = setupHook(useUIActionConvForward);
		expect(hookResult.current).toEqual({
			id: 'conversation-forward',
			label: 'Forward',
			icon: 'Forward',
			canExecute: expect.anything(),
			execute: expect.anything()
		});
	});

	describe('can execute', () => {
		it('Should not be executable if the conversation has no messages', () => {
			const conversation = generateConversation({
				messagesGenerationCount: 0
			});
			const { result: hookResult } = setupHook(useUIActionConvForward);
			const action = hookResult.current;
			expect(action.canExecute?.(conversation)).toBeFalsy();
		});

		it.each`
			folder                              | canExecute
			${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTION.YES}
			${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTION.NO}
			${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTION.NO}
			${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTION.NO}
			${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTION.NO}
			${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTION.YES}
		`(
			`the action can$canExecute.desc be executed for a conversation in the $folder.desc folder`,
			({ folder, canExecute }) => {
				const conversation = generateConversation({
					folderId: folder.id,
					messagesGenerationCount: faker.number.int({ min: 1, max: 15 })
				});
				const { result: hookResult } = setupHook(useUIActionConvForward);
				const action = hookResult.current;
				expect(action.canExecute?.(conversation)).toBe(canExecute.value);
			}
		);
	});

	describe('execute', () => {
		it('Should not add a board if the action cannot be executed', () => {
			const conversation = generateConversation({
				messagesGenerationCount: 0
			});
			const { result: hookResult } = setupHook(useUIActionConvForward);
			const action = hookResult.current;
			if (!action.execute) {
				return;
			}
			const params: Parameters<NonNullable<ConvForwardUIAction['execute']>>[0] = {
				conversation
			};

			action.execute?.(params);
			expect(addBoard).not.toBeCalled();
		});

		it('Should add a board on a specific url', () => {
			const conversation = generateConversation({
				messages: [
					generateMessage({
						id: '10',
						folderId: FOLDERS_DESCRIPTORS.INBOX.id,
						receiveDate: Date.UTC(2024, 2, 29, 12, 7, 3)
					}),
					generateMessage({
						id: '20',
						folderId: FOLDERS_DESCRIPTORS.SENT.id,
						isSentByMe: true,
						receiveDate: Date.UTC(2024, 2, 29, 14, 10, 8)
					}),
					generateMessage({
						id: '50',
						folderId: FOLDERS_DESCRIPTORS.DRAFTS.id,
						isDraft: true,
						receiveDate: Date.UTC(2024, 2, 29, 14, 33, 11)
					}),
					generateMessage({
						id: '30',
						folderId: FOLDERS_DESCRIPTORS.INBOX.id,
						receiveDate: Date.UTC(2024, 2, 29, 15, 11, 23)
					}),
					generateMessage({
						id: '40',
						folderId: FOLDERS_DESCRIPTORS.DRAFTS.id,
						isDraft: true,
						receiveDate: Date.UTC(2024, 2, 29, 17, 43, 11)
					})
				]
			});
			const { result: hookResult } = setupHook(useUIActionConvForward);
			const action = hookResult.current;
			const params: Parameters<NonNullable<ConvForwardUIAction['execute']>>[0] = {
				conversation
			};
			action.execute?.(params);

			expect(addBoard).toBeCalledWith(
				expect.objectContaining({
					url: `mails/edit?action=forward&id=30`
				})
			);
		});
	});
});
