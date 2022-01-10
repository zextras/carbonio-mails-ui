/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-filename-extension */
// import React from 'react';
// import { screen } from '@testing-library/react';
// import { testUtils } from '@zextras/zapp-shell';
// import reducers from '../../../../store/reducers';
// import PreviewPanelHeader from './preview-panel-header';
// import { generateConversation } from '../../../../mocks/generators';
// import { normalizeConversationFromSoap } from '../../../../normalizations/normalize-conversation';

describe.skip('PreviewPanelHeader', () => {
	test.skip('Contains Subject', async () => {
		// const conversation = normalizeConversationFromSoap(generateConversation({}));
		// const ctxt = {};
		// await testUtils.render(<PreviewPanelHeader folderId={'3'} conversation={conversation} />, {
		// 	ctxt,
		// 	reducer: reducers
		// });
		// expect(screen.getByTestId('PreviewPanelHeader')).toBeInTheDocument();
		// expect(screen.getByTestId('PreviewPanelHeader')).toContainHTML(conversation.subject);
	});

	// test.skip('Contains (No subject) if subject is empty', async () => {
	// 	const conversation = normalizeConversationFromSoap(generateConversation({ subject: '' }));

	// 	const ctxt = {};

	// 	await testUtils.render(<PreviewPanelHeader folderId={'3'} conversation={conversation} />, {
	// 		ctxt,
	// 		reducer: reducers
	// 	});
	// 	expect(screen.getByTestId('Subject')).toContainHTML('(label.no_subject, 'No subject')');
	// });

	// test.skip('Contains Read icon if conversation read', async () => {
	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

	// 	const ctxt = {};
	// 	await testUtils.render(<PreviewPanelHeader folderId={'3'} conversation={conversation} />, {
	// 		ctxt,
	// 		reducer: reducers
	// 	});

	// 	expect(screen.getByTestId('EmailReadIcon')).toBeDefined();
	// 	expect(screen.getByTestId('PreviewPanelHeader')).not.toContainHTML('EmailUnreadIcon');
	// });

	// test.skip('Contains Unread icon if conversation unread', async () => {
	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: false }));

	// 	const ctxt = {};
	// 	await testUtils.render(<PreviewPanelHeader folderId={'3'} conversation={conversation} />, {
	// 		ctxt,
	// 		reducer: reducers
	// 	});

	// 	expect(screen.getByTestId('EmailUnreadIcon')).toBeDefined();
	// 	expect(screen.getByTestId('PreviewPanelHeader')).not.toContainHTML('EmailReadIcon');
	// });

	// test.skip('Contain close icon', async () => {
	// 	const conversation = normalizeConversationFromSoap(generateConversation({}));

	// 	const ctxt = {};

	// 	await testUtils.render(<PreviewPanelHeader folderId={'3'} conversation={conversation} />, {
	// 		ctxt,
	// 		reducer: reducers
	// 	});
	// 	expect(screen.getByTestId('PreviewPanelCloseIcon')).toBeDefined();
	// });
});
