/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// import { noop } from 'lodash';
// import React from 'react';
// import { screen } from '@testing-library/react';
// import { folderAction } from '../../store/actions/folder-action';
// import { setupTest } from '../../test/utils/test-utils';
// import { FolderType } from '../../types';
// import { AccordionCustomComponent } from './accordion-custom-component';
// import { EditModal } from './edit-modal';
//
// jest.mock('../../store/actions/folder-action', () => {
// 	const originalModule = jest.requireActual('../../store/actions/folder-action');
// 	return {
// 		__esModule: true,
// 		...originalModule,
// 		folderAction: jest.fn((payload) => payload)
// 	};
// });
//
// // TODO add parameter
// const createFolder = (): FolderType => ({
// 	id: '2',
// 	uuid: '2',
// 	name: 'Inbox',
// 	path: '/Inbox',
// 	parent: '0',
// 	parentUuid: '0',
// 	unreadCount: 123,
// 	size: 440,
// 	itemsCount: 440,
// 	synced: true,
// 	absParent: '0',
// 	items: [],
// 	level: 1,
// 	to: '',
// 	color: '4',
// 	rgb: '434343'
// });
//
describe('My first sweet test', () => {
	test('Color', async () => {
		//
		// 		const accordionFolder = {
		// 			id: '2',
		// 			label: 'Inbox',
		// 			items: [],
		// 			folder: createFolder(),
		// 			CustomComponent: AccordionCustomComponent
		// 		};
		//
		// 		// FIXME fix as soon as the Accordion will be refactored
		// 		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// 		// @ts-ignore
		// 		const modal: React.ReactElement = <EditModal folder={accordionFolder} onClose={noop} />;
		// 		setupTest(modal);
		// 		expect(screen.getByTestId('folder-name')).toBeVisible();
		// 		// render(modal);
		//
		// 		// expect(1).toBe(1);
	});
});
