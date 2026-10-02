/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import { Board, getBoardById } from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';
import { http, HttpResponse } from 'msw';
import type { Mock } from 'vitest';
import { create } from 'zustand';

import { getSetupServer } from '../../../../../../__test__/vitest-setup';
import { updateMessages } from '../../../../../../store/emails/store';
import { setupTest, screen } from '@test-setup';
import {
	updateBoardContext,
	useBoard,
	getUserSettings,
	useIntegratedFunction,
	useLocalStorage,
	useUserSettings
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { ASSERTIONS } from '__test__/constants';
import { setupEditorStore } from '__test__/generators/editor-store';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { EditViewActions, LOCAL_STORAGE_LEGACY_EDITOR } from 'constants/index';
import { useEditorsStore } from 'store/editor';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { getSoapMailMessage } from 'store/emails/actions/tests/test-utils';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';
import { EditViewBoardContext } from 'views/app/detail-panel/edit/edit-view-board';
import EditViewController from 'views/app/detail-panel/edit/edit-view-controller';
import { FileNode } from 'views/app/detail-panel/edit/editor/edit-utils-hooks/use-upload-from-files';

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
const displayPrefValues = ['TRUE', 'FALSE'];
type TestCase = {
	action: (typeof actions)[number];
	msgIsHtml: typeof ASSERTIONS.IS | typeof ASSERTIONS.IS_NOT;
	isComplete: typeof ASSERTIONS.IS | typeof ASSERTIONS.IS_NOT;
	isTruncated: typeof ASSERTIONS.IS | typeof ASSERTIONS.IS_NOT;
	editPref: 'html' | 'plain';
	displayHTMLPref: 'TRUE' | 'FALSE';
};

const APIDimensions = {
	action: actions,
	isComplete: completeness,
	isTruncated: truncatedStates,
	msgIsHtml: msgHtmlValue,
	editPref: prefValues,
	displayHTMLPref: displayPrefValues
};

const shouldCallApi = (testCase: TestCase): boolean => {
	const editAsHtml = testCase.editPref === 'html';

	const messageFormatMismatch = testCase.msgIsHtml === ASSERTIONS.IS ? !editAsHtml : editAsHtml;

	const messageNotComplete =
		testCase.isComplete !== ASSERTIONS.IS || testCase.isTruncated !== ASSERTIONS.IS_NOT;

	return messageFormatMismatch || messageNotComplete;
};

const shouldNotCallApi = (testCase: TestCase): boolean => !shouldCallApi(testCase);

const generateCases = (dimensions: typeof APIDimensions): TestCase[] =>
	Object.entries(dimensions).reduce<TestCase[]>(
		(acc, [key, values]) =>
			acc.flatMap((prev) => values.map((value) => ({ ...prev, [key]: value }))),
		[{} as TestCase]
	);

const allCases = generateCases(APIDimensions);
const apiCases = allCases.filter(shouldCallApi);
const noApiCases = allCases.filter(shouldNotCallApi);

describe('EditViewController', () => {
	beforeEach(() => {
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

	it.each(noApiCases)(
		'[$action] should NOT call any API: msgIsHtml=$msgIsHtml.value, isComplete=$isComplete.value, isTruncated=$isTruncated.value, editPref=$editPref, displayHTMLPref=$displayHTMLPref',
		async ({ action, editPref, msgIsHtml }) => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: editPref
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ truncated: false, isComplete: true, html: msgIsHtml.value }]
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

	it.each(apiCases)(
		'[$action] should call API: msgIsHtml=$msgIsHtml.value, isComplete=$isComplete.value, isTruncated=$isTruncated.value, editPref=$editPref, displayHTMLPref=$displayHTMLPref',
		async ({ action, isComplete, isTruncated, editPref, msgIsHtml, displayHTMLPref }) => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefComposeFormat: editPref,
					zimbraPrefMessageViewHtmlPreferred: displayHTMLPref
				}
			});
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{ truncated: isTruncated.value, isComplete: isComplete.value, html: msgIsHtml.value }
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

	describe('Files nodes passed when the board is opened', () => {
		const MAX_MESSAGE_SIZE = 10485760;

		const useLegacyEditorPreferenceStore = create<{ enabled: boolean }>(() => ({
			enabled: true
		}));

		function useLocalStorageMock(key: string): [unknown, () => void] {
			const legacyEditorEnabled = useLegacyEditorPreferenceStore((state) => state.enabled);
			return [key === LOCAL_STORAGE_LEGACY_EDITOR ? legacyEditorEnabled : vi.fn(), vi.fn()];
		}

		const getEditView = (): HTMLElement => screen.getByTestId('edit-view-editor');

		const mockUploadTo = (uploadTo: Mock): void => {
			useIntegratedFunction.mockImplementation((id: string) =>
				id === 'upload-to-target-and-get-target-id' ? [uploadTo, true] : [vi.fn(), false]
			);
		};

		const createFileNode = (size: number): FileNode => ({
			id: faker.string.uuid(),
			name: faker.system.fileName(),
			size,
			mime_type: 'application/pdf',
			__typename: 'File'
		});

		/*
		 * Keep the board context in a variable, as the shell boards store does,
		 * so that the context updated by the controller can be read again
		 */
		const setupBoard = (
			filesNodes: Array<FileNode>
		): {
			board: Board<EditViewBoardContext>;
			getContext: () => EditViewBoardContext | undefined;
		} => {
			const board = createBoardMock({
				originAction: EditViewActions.PREFILL_COMPOSE,
				pendingFilesNodes: filesNodes
			});
			let { context } = board;
			useBoard.mockImplementation(() => ({ ...board, context }));
			updateBoardContext.mockImplementation((_id: string, newContext: EditViewBoardContext) => {
				context = newContext;
			});
			vi.mocked(getBoardById).mockImplementation((() => ({
				...board,
				context
			})) as typeof getBoardById);
			return { board, getContext: () => context };
		};

		beforeEach(() => {
			useLegacyEditorPreferenceStore.setState({ enabled: true });
			useLocalStorage.mockImplementation(useLocalStorageMock);
			const settings = generateSettings({
				attrs: { zimbraMtaMaxMessageSize: `${MAX_MESSAGE_SIZE}` }
			});
			useUserSettings.mockReturnValue(settings);
			// the compose format set by the other tests is kept, so reset it
			getUserSettings.mockReturnValue(settings);
			// each mounted edit view sends its own request, so each one needs its own response
			getSetupServer().use(
				http.get('/service/extension/encryption/password/enabled', () =>
					HttpResponse.json({ enabled: false })
				)
			);
		});

		it('should remove the nodes from the board context keeping the editor id', async () => {
			const uploadTo = vi.fn().mockResolvedValue({ attachmentId: faker.string.uuid() });
			mockUploadTo(uploadTo);
			const { board } = setupBoard([createFileNode(1000)]);

			await act(async () => setupTest(<EditViewController />));

			await waitFor(() => expect(uploadTo).toHaveBeenCalled());
			// the first update of the context is the one which stores the id of the generated editor
			const { editorId } = updateBoardContext.mock.calls[0][1];
			expect(editorId).toBeDefined();
			expect(updateBoardContext).toHaveBeenLastCalledWith(
				board.id,
				expect.objectContaining<Partial<EditViewBoardContext>>({
					editorId,
					pendingFilesNodes: undefined
				})
			);
		});

		it('should upload the nodes only once if the edit view is re-mounted switching the editor', async () => {
			const attachmentId = faker.string.uuid();
			const uploadTo = vi.fn().mockResolvedValue({ attachmentId });
			mockUploadTo(uploadTo);
			const { getContext } = setupBoard([createFileNode(1000)]);

			await act(async () => setupTest(<EditViewController />));
			const legacyEditView = getEditView();
			await waitFor(() => expect(uploadTo).toHaveBeenCalled());

			act(() => {
				useLegacyEditorPreferenceStore.setState({ enabled: false });
			});

			await waitFor(() => expect(getEditView()).not.toBe(legacyEditView));
			const editorId = getContext()?.editorId ?? '';
			await waitFor(() =>
				expect(useEditorsStore.getState().editors[editorId].unsavedAttachments).toEqual([
					expect.objectContaining({ aid: attachmentId })
				])
			);
			expect(uploadTo).toHaveBeenCalledTimes(1);
		});

		it('should propose the smart links only once if the edit view is re-mounted switching the editor', async () => {
			const uploadTo = vi.fn();
			mockUploadTo(uploadTo);
			setupBoard([createFileNode(MAX_MESSAGE_SIZE)]);

			await act(async () => setupTest(<EditViewController />));
			expect(await screen.findAllByTestId('convert-to-smartlink-modal')).toHaveLength(1);
			const legacyEditView = getEditView();

			act(() => {
				useLegacyEditorPreferenceStore.setState({ enabled: false });
			});

			await waitFor(() => expect(getEditView()).not.toBe(legacyEditView));
			expect(screen.getAllByTestId('convert-to-smartlink-modal')).toHaveLength(1);
			expect(uploadTo).not.toHaveBeenCalled();
		});
	});
});
