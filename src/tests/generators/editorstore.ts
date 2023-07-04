/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEditorsStore } from '../../store/zustand/editor/store';
import { MailsEditorV2 } from '../../types';

export const mockedEditors: MailsEditorV2[] = [
	{
		id: '0',
		subject: 'Test subject',
		text: ['Test text', 'Test text 2']
		attachments: [
			{
				id: '0',
				name: 'Test attachment',
				size: 100,
				type: 'text/plain'
			}
		],
		autoSendTime: null,
		contacts: [],
		contactGroups: [],
		contactLists: [],
		contactSelection: [],
		contactGroupSelection: [],
	}
];
export function setupAppStore(editors = mockedEditors): void {
	editors.forEach((editor, index) => {
		useEditorsStore.getState().addEditor(index.toString(), editor);
	}
/**
 *
 * @param state
 */
export const generateState = (state?: Partial<MailsStateType>): MailsStateType => ({
		editors: {
			...getEditorsSliceInitialState(),
			...state?.editors
		},
		/**
		 *
		 * @param initialState
		 */
		export const generateStore = (
			initialState?: Partial<MailsStateType>
		): EnhancedStore<MailsStateType> => {
			const store = configureStore({
				devTools: {
					name: MAIL_APP_ID
				},
				reducer: storeReducers,
				preloadedState: generateState(initialState)
			});

			return store;
		};
