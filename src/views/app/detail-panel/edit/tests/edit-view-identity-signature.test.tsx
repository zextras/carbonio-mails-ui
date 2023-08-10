/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { useBoard as mockedUseBoard } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { getMocksContext } from '../../../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { convertHtmlToPlainText } from '../../../../../carbonio-ui-commons/utils/text/html';
import { EditViewActions, MAILS_ROUTE } from '../../../../../constants';
import {
	getSignatureValue,
	replaceSignatureOnPlainTextBody
} from '../../../../../helpers/signatures';
import * as useQueryParam from '../../../../../hooks/use-query-param';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import EditView from '../edit-view';

/**
 * Test the EditView component for set signature for selected from identity
 */
describe('New and Replay email view', () => {
	describe('Signature set as per the identity selection in from', () => {
		test('user default identity is selected', async () => {
			// Get the default identity
			const mocksContext = getMocksContext();
			const defaultIdentity = mocksContext.identities.primary;

			const account = getUserAccount();
			const signatureId = defaultIdentity.signatures
				? defaultIdentity.signatures?.newEmailSignature.id
				: '';
			const signatureContent = getSignatureValue(account, signatureId);
			const store = generateStore();
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				mailId: 'new-2',
				folderId: FOLDERS.INBOX,
				setHeader: noop,
				toggleAppBoard: false
			};

			// Create and wait for the component to be rendered
			setupTest(<EditView {...props} />, { store });
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 10000 }
			);
			expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
			expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
				defaultIdentity.identity.email
			);

			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');
			const plainSignatureValue =
				signatureContent !== '' ? `\n${convertHtmlToPlainText(signatureContent)}\n\n` : '';
			const plainContent = replaceSignatureOnPlainTextBody(
				editorTextareaElement.innerHTML,
				plainSignatureValue
			);
			expect(editorTextareaElement).toHaveValue(plainContent);
		});

		test('shared account identity is selected with replay and signature set accordingly', async () => {
			// Get the identities
			const mocksContext = getMocksContext();
			const defaultIdentity = mocksContext.identities.primary;
			const sharedAccountIdentity = mocksContext.identities.sendAs[0];

			const account = getUserAccount();
			const signatureId = sharedAccountIdentity.signatures
				? sharedAccountIdentity.signatures?.forwardReplySignature.id
				: '';
			const signatureContent = getSignatureValue(account, signatureId);
			// Generate the message
			const to = [
				{
					type: ParticipantRole.TO,
					address: defaultIdentity.identity.email,
					fullName: defaultIdentity.identity.fullName
				},
				{
					type: ParticipantRole.TO,
					address: sharedAccountIdentity.identity.email,
					fullName: sharedAccountIdentity.identity.fullName
				}
			];
			const msgId = `${sharedAccountIdentity.identity.id}:1234`;
			const folderId = `${sharedAccountIdentity.identity.id}:${FOLDERS.INBOX}`;
			const msg = generateMessage({ id: msgId, to, folderId, isComplete: true });

			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						[msg.id]: msg
					},
					status: {}
				}
			});

			populateFoldersStore();

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return EditViewActions.REPLY;
				}
				return undefined;
			});

			// Mock the board context
			mockedUseBoard.mockImplementation(() => ({
				url: `${MAILS_ROUTE}/edit/${msg.id}?action=${EditViewActions.REPLY}`,
				context: { mailId: msg.id, folderId },
				title: ''
			}));

			const props = {
				setHeader: noop
			};

			// Create and wait for the component to be rendered
			setupTest(<EditView {...props} />, { store });
			expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();
			expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
				sharedAccountIdentity.identity.email
			);
			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');
			const plainSignatureValue =
				signatureContent !== '' ? `\n${convertHtmlToPlainText(signatureContent)}\n\n` : '';
			const plainContent = replaceSignatureOnPlainTextBody(
				editorTextareaElement.innerHTML,
				plainSignatureValue
			);
			expect(editorTextareaElement).toHaveValue(plainContent);
		});
	});
});
