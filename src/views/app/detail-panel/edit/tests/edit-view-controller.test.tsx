/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { Board } from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { useBoard, getUserSettings } from '@test-mocks/@zextras/carbonio-shell-ui';
import { setupTest } from '@test-setup';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { ASSERTIONS } from '__test__/constants';
import { setupEditorStore } from '__test__/generators/editor-store';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { EditViewActions } from 'constants/index';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { getSoapMailMessage } from 'store/emails/actions/tests/test-utils';
import { GetMsgRequest, GetMsgResponse } from 'types/index.d';
import { EditViewBoardContext } from 'views/app/detail-panel/edit/edit-view-board';
import EditViewController from 'views/app/detail-panel/edit/edit-view-controller';

const createBoardMock = (contextModel: EditViewBoardContext): Board<EditViewBoardContext> => ({
	id: faker.string.uuid(),
	boardViewId: faker.string.uuid(),
	app: faker.word.noun(),
	icon: faker.word.noun(),
	title: faker.word.noun(),
	context: contextModel
});

describe('EditViewController', () => {
	beforeAll(() => {
		createSoapAPIInterceptor('SaveDraft');
		createSoapAPIInterceptor('GetShareInfo');
		createAPIInterceptor(
			'get',
			'/service/extension/encryption/password/enabled',
			HttpResponse.json({ enabled: false })
		);
	});

	it('should render correctly', async () => {
		// Mock the board
		const boardMock = createBoardMock({
			originAction: EditViewActions.NEW
		});
		useBoard.mockReturnValue(boardMock);

		const { container } = await act(async () => setupTest(<EditViewController />));

		expect(container).toBeInTheDocument();
	});

	it.each`
		action
		${EditViewActions.NEW}
		${EditViewActions.RESUME}
		${EditViewActions.MAIL_TO}
		${EditViewActions.COMPOSE}
		${EditViewActions.PREFILL_COMPOSE}
	`(`should not call the getMsg API when the action preformed is $action`, async ({ action }) => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const boardMock = createBoardMock({
			originAction: action,
			editorId: editor.id
		});
		useBoard.mockReturnValue(boardMock);
		const apiCallFlag = vi.fn();
		createSoapAPIInterceptor('GetMsg').finally(() => apiCallFlag({} as GetMsgRequest));

		await act(async () => setupTest(<EditViewController />));

		expect(apiCallFlag).not.toHaveBeenCalledWith();
	});

	it.each`
		action
		${EditViewActions.REPLY}
		${EditViewActions.REPLY_ALL}
		${EditViewActions.FORWARD}
		${EditViewActions.FORWARD_AS_ATTACHMENT}
		${EditViewActions.EDIT_AS_NEW}
		${EditViewActions.EDIT_AS_DRAFT}
	`(
		`should not call the getMsg API if the action is $action but the required  message is fully loaded`,
		async ({ action }) => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: false, isComplete: true }]
			});

			const boardMock = createBoardMock({
				originAction: action,
				originActionTargetId: messages[0].id
			});
			useBoard.mockReturnValue(boardMock);
			const apiCallFlag = vi.fn();
			createSoapAPIInterceptor('GetMsg').finally(() => apiCallFlag({} as GetMsgRequest));

			await act(async () => setupTest(<EditViewController />));

			expect(apiCallFlag).not.toHaveBeenCalledWith();
		}
	);

	it.each`
		action                                   | isComplete           | isTruncated
		${EditViewActions.REPLY}                 | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.REPLY}                 | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.REPLY}                 | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
		${EditViewActions.REPLY_ALL}             | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.REPLY_ALL}             | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.REPLY_ALL}             | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
		${EditViewActions.FORWARD}               | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.FORWARD}               | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.FORWARD}               | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
		${EditViewActions.FORWARD_AS_ATTACHMENT} | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.FORWARD_AS_ATTACHMENT} | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.FORWARD_AS_ATTACHMENT} | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
		${EditViewActions.EDIT_AS_NEW}           | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.EDIT_AS_NEW}           | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.EDIT_AS_NEW}           | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
		${EditViewActions.EDIT_AS_DRAFT}         | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS}
		${EditViewActions.EDIT_AS_DRAFT}         | ${ASSERTIONS.IS_NOT} | ${ASSERTIONS.IS_NOT}
		${EditViewActions.EDIT_AS_DRAFT}         | ${ASSERTIONS.IS}     | ${ASSERTIONS.IS}
	`(
		`should call the getMsg API if the action is $action, the required message $isComplete.desc complete and $isTruncated.desc truncated`,
		async ({ action, isComplete, isTruncated }) => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: isTruncated.value, isComplete: isComplete.value }]
			});

			const boardMock = createBoardMock({
				originAction: action,
				originActionTargetId: messages[0].id
			});
			useBoard.mockReturnValue(boardMock);
			const soapMessage = getSoapMailMessage(messages[0].id);
			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [soapMessage]
			});

			await act(async () => setupTest(<EditViewController />));

			const getMsgRequest = await getMsgInterceptor;

			expect(getMsgRequest).toEqual(
				expect.objectContaining({
					m: expect.objectContaining({
						id: messages[0].id
					})
				})
			);
		}
	);
	it('should call getMsg API when the preferred body format is not available', async () => {
		getUserSettings.mockReturnValue({
			attrs: {},
			props: [],
			prefs: {
				zimbraPrefComposeFormat: 'plain'
			}
		});
		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [{ truncated: false, isComplete: true }]
		});

		const boardMock = createBoardMock({
			originAction: EditViewActions.REPLY,
			originActionTargetId: messages[0].id
		});
		useBoard.mockReturnValue(boardMock);
		const soapMessage = getSoapMailMessage(messages[0].id);
		const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
			m: [soapMessage]
		});

		await act(async () => setupTest(<EditViewController />));

		const getMsgRequest = await getMsgInterceptor;

		expect(getMsgRequest).toEqual(
			expect.objectContaining({
				m: expect.objectContaining({
					id: messages[0].id
				})
			})
		);
	});
});
