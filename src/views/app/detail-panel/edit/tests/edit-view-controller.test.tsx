/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { Board } from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';
import { HttpResponse } from 'msw';

import { updateMessages } from '../../../../../store/emails/store';
import { EditViewActionsType } from '../../../../../types/editor';
import { setupTest, screen } from '@test-setup';
import {
	updateBoardContext,
	useBoard,
	getUserSettings
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
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

const messageMock = populateMessagesInEmailStore({
	messagesNumber: 1,
	messageGeneratorParams: [
		{
			cid: 'conversation-id-1234',
			isComplete: true
		}
	]
})[0];

const actions = [
	EditViewActions.REPLY,
	EditViewActions.REPLY_ALL,
	EditViewActions.FORWARD,
	EditViewActions.FORWARD_AS_ATTACHMENT,
	EditViewActions.EDIT_AS_NEW,
	EditViewActions.EDIT_AS_DRAFT
];

const completeness = [ASSERTIONS.IS, ASSERTIONS.IS_NOT];
const truncatedStates = [ASSERTIONS.IS, ASSERTIONS.IS_NOT];
const msgHtmlValue = [ASSERTIONS.IS, ASSERTIONS.IS_NOT];
const prefValues = ['html', 'plain'];
type TestCase = {
	action: EditViewActionsType;
	isComplete: typeof ASSERTIONS.IS;
	isTruncated: typeof ASSERTIONS.IS;
	pref: 'html' | 'plain';
	isHtml: boolean;
};

const callApiDimensions = {
	action: actions,
	isComplete: completeness,
	isTruncated: truncatedStates,
	isHtml: msgHtmlValue,
	pref: prefValues
};

const notCallApiDimensions = {
	action: actions,
	isHtml: msgHtmlValue,
	pref: prefValues
};

const callApiCases = Object.entries(callApiDimensions)
	.reduce<TestCase[]>(
		(acc, [key, values]) =>
			acc.flatMap((prev) =>
				values.map((value) => ({
					...prev,
					[key]: value
				}))
			),
		[{} as TestCase]
	)
	.filter(
		({ pref, isHtml }) =>
			!(pref === 'html' && isHtml === true) && !(pref === 'plain' && isHtml === false)
	);

const notCallApiCases = Object.entries(notCallApiDimensions)
	.reduce<TestCase[]>(
		(acc, [key, values]) =>
			acc.flatMap((prev) =>
				values.map((value) => ({
					...prev,
					[key]: value
				}))
			),
		[{} as TestCase]
	)
	.filter(({ pref, isHtml }) => (pref === 'html') === isHtml);

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
	`(`should not call the getMsg API when the action performed is $action`, async ({ action }) => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const boardMock = createBoardMock({
			originAction: action,
			editorId: editor.id
		});
		useBoard.mockReturnValue(boardMock);
		const apiCallFlag = vi.fn();
		createSoapAPIInterceptor('GetMsg', messageMock).finally(apiCallFlag);

		await act(async () => setupTest(<EditViewController />));

		expect(apiCallFlag).not.toHaveBeenCalled();
	});

	it.each(notCallApiCases)(
		`should not call the getMsg API if the action is $action, the required message is complete and is not truncated and $isHtml.desc html and preference is $pref`,
		async ({ action, pref, isHtml }) => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: pref
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: false, isComplete: true, html: isHtml }]
			});

			const boardMock = createBoardMock({
				originAction: action,
				originActionTargetId: messages[0].id
			});
			useBoard.mockReturnValue(boardMock);
			const apiCallFlag = vi.fn();
			createSoapAPIInterceptor('GetMsg', messageMock).finally(apiCallFlag);
			await act(async () => setupTest(<EditViewController />));

			expect(apiCallFlag).not.toHaveBeenCalled();
		}
	);

	it.each(callApiCases)(
		`should call the getMsg API if the action is $action, the required message $isComplete.desc complete and $isTruncated.desc truncated and $isHtml.desc html and preference is $pref`,
		async ({ action, isComplete, isTruncated, pref, isHtml }) => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: pref
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{ truncated: isTruncated.value, isComplete: isComplete.value, html: isHtml }
				]
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

	it("shouldn't unmount the editor when the message is updated", async () => {
		getUserSettings.mockReturnValue({
			attrs: {},
			props: [],
			prefs: {
				zimbraPrefComposeFormat: 'html'
			}
		});
		const message = populateMessagesInEmailStore({
			messagesNumber: 1,
			messageGeneratorParams: [
				{
					cid: 'conversation-id-1234',
					isComplete: true
				}
			]
		})[0];

		const boardMock = createBoardMock({
			originAction: EditViewActions.REPLY,
			originActionTargetId: message.id
		});
		useBoard.mockReturnValue(boardMock);

		await act(async () => setupTest(<EditViewController />));
		expect(screen.getByRole('button', { name: /send/i })).toBeVisible();

		expect(updateBoardContext).toHaveBeenCalledTimes(1);
		const updateContext = updateBoardContext.mock.calls[0][1];

		// Update the board context to simulate re-opening the editor
		useBoard.mockReturnValue({
			...boardMock,
			context: updateContext
		});

		// Update the message conversation id and the isComplete flag to simulate
		// the need to reload the message
		act(() => {
			updateMessages([
				{
					...message,
					conversation: 'new-conversation-id-5678',
					isComplete: false
				}
			]);
		});

		expect(screen.getByRole('button', { name: /send/i })).toBeVisible();
	});
	it('should render a loader when the message is not available', async () => {
		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [{ isComplete: false }]
		});

		const boardMock = createBoardMock({
			originAction: EditViewActions.REPLY,
			originActionTargetId: messages[0].id
		});
		useBoard.mockReturnValue(boardMock);
		const errorResponse = buildSoapErrorResponseBody();
		const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, ErrorSoapBodyResponse>(
			'GetMsg',
			errorResponse
		);

		await act(async () => setupTest(<EditViewController />));
		await getMsgInterceptor;
		expect(screen.getByTestId('EditViewControllerLoader')).toBeVisible();
	});

	it('should not render a loader when the message is available', async () => {
		const messages = populateMessagesInEmailStore();
		const soapMessage = getSoapMailMessage(messages[0].id);
		const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
			m: [soapMessage]
		});
		const boardMock = createBoardMock({
			originAction: EditViewActions.REPLY,
			originActionTargetId: messages[0].id
		});
		useBoard.mockReturnValue(boardMock);
		await act(async () => setupTest(<EditViewController />));
		await getMsgInterceptor;

		expect(screen.getByTestId('edit-view-editor')).toBeVisible();
	});
});
