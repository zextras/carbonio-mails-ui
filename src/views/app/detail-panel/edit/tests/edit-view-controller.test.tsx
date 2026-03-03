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
		`should call the getMsg API even if the action is $action and the required  message is fully loaded`,
		async ({ action }) => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: 'html'
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: false, isComplete: true }]
			});

			const boardMock = createBoardMock({
				originAction: action,
				originActionTargetId: messages[0].id
			});
			useBoard.mockReturnValue(boardMock);
			const apiCallFlag = vi.fn();
			createSoapAPIInterceptor('GetMsg', messageMock).finally(apiCallFlag);

			await act(async () => setupTest(<EditViewController />));

			expect(apiCallFlag).toHaveBeenCalled();
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
	describe('should render a loader when', () => {
		it('the message is not complete', async () => {
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
		it('the message is truncated', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: true }]
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
		it('html parts exist but have no rich text content', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						parts: [
							{
								contentType: 'text/html',
								name: 'name',
								size: 2
							}
						]
					}
				]
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
		it('text parts exist but have no plain text content', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						parts: [
							{
								contentType: 'text/plain',
								name: 'name',
								size: 2
							}
						]
					}
				]
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
	});
	describe('should not render a loader when', () => {
		it('the message is complete', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ isComplete: true }]
			});
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
		it('the message has no parts available', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						truncated: false,
						isComplete: true,
						parts: [
							{
								contentType: 'multipart/alternative',
								parts: [],
								size: 0,
								name: 'name'
							}
						]
					}
				]
			});
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
		it('the message is not truncated', async () => {
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ isComplete: true, truncated: false }]
			});

			const boardMock = createBoardMock({
				originAction: EditViewActions.REPLY,
				originActionTargetId: messages[0].id
			});
			const soapMessage = getSoapMailMessage(messages[0].id);
			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [soapMessage]
			});
			useBoard.mockReturnValue(boardMock);

			await act(async () => setupTest(<EditViewController />));
			await getMsgInterceptor;
			expect(screen.getByTestId('edit-view-editor')).toBeVisible();
		});
		it('html parts exist and have rich text content', async () => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: 'html'
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						isComplete: true,
						parts: [
							{
								contentType: 'text/html',
								content: 'content',
								name: 'name',
								size: 2
							}
						]
					}
				]
			});
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
		it('text parts exist and have plain text content', async () => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: 'plain'
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						isComplete: true,
						parts: [
							{
								contentType: 'text/plain',
								content: 'content',
								name: 'name',
								size: 2
							}
						]
					}
				]
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
			await getMsgInterceptor;
			expect(screen.getByTestId('edit-view-editor')).toBeVisible();
		});
	});
});
