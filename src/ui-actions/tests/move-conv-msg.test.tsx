/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, screen } from '@testing-library/react';
import { times } from 'lodash';
import React from 'react';
import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { makeListItemsVisible, setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { MailMessage, MsgActionRequest, MsgActionResponse } from '../../types';
import MoveConvMessage from '../move-conv-msg';

describe('MoveConvMsg', () => {
	it.todo('Should display the modal title');

	it.todo('Should display a confirm button');

	it(
		'When a destination folder is selected and the user clicks on the confirm the API is called and the success snackbar is displayed',
		 async () => {
			 populateFoldersStore({ view: FOLDER_VIEW.message });

			 const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			 const sourceFolder = inboxChildren?.[0].id ?? '';
			 const destinationFolder = FOLDERS.INBOX;

			 const msgs: Array<MailMessage> = times(10, () => generateMessage({ folderId: sourceFolder }));
			 const msgIds = msgs.map<string>((msg) => msg.id);

			 const store = generateStore({
				 messages: {
					 searchedInFolder: {},
					 messages: msgs,
					 searchRequestStatus: API_REQUEST_STATUS.fulfilled
				 }
			 });

			 const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				 'MsgAction',
				 {
					 action: {
						 id: msgIds.join(','),
						 op: 'move'
					 }
				 }
			 );

			 const component = (
				 <MoveConvMessage
					 folderId={sourceFolder}
					 selectedIDs={msgIds}
					 onClose={jest.fn()}
					 isMessageView
					 isRestore={false}
					 deselectAll={jest.fn()}
					 dispatch={store.dispatch}
				 />
			 );

			 const { user } = setupTest(component, { store });
			 makeListItemsVisible();

			 const inboxFolderListItem = await screen.findByTestId(
				 `folder-accordion-item-${destinationFolder}`,
				 {},
				 { timeout: 10000 }
			 );

			 act(() => {
				 jest.advanceTimersByTime(1000);
			 });

			 await act(async () => {
				 await user.click(inboxFolderListItem);
			 });

			 const button = screen.getByRole('button', {
				 name: /label\.move/i
			 });
			 expect(button).toBeEnabled();

			 await act(async () => {
				 await user.click(button);
			 });

			 const requestParameter = await interceptor;
			 expect(requestParameter.action.id).toBe(msgIds.join(','));
			 expect(requestParameter.action.op).toBe('move');
			 expect(requestParameter.action.l).toBe(destinationFolder);
			 expect(requestParameter.action.f).toBeUndefined();
			 expect(requestParameter.action.tn).toBeUndefined();
		 });
		 }
	);
});
