/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import React, { FC } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { AppContext } from '../../types';
import ConversationPreviewPanel from './detail-panel/conversation-preview-panel';
import MailEditPanel from './detail-panel/mail-edit-panel';
import MessagePreviewPanel from './detail-panel/message-preview-panel';
import { SelectionInteractive } from './detail-panel/selection-interactive';

const DetailPanel: FC = () => {
	const { path } = useRouteMatch();
	const { count } = useAppContext<AppContext>();
	return (
		<Container width="60%" data-testid="third-panel">
			<Switch>
				<Route exact path={`${path}/folder/:folderId`}>
					<SelectionInteractive count={count} />
				</Route>
				<Route exact path={`${path}/folder/:folderId/conversation/:conversationId`}>
					<ConversationPreviewPanel />
				</Route>
				<Route exact path={`${path}/folder/:folderId/message/:messageId`}>
					<MessagePreviewPanel />
				</Route>
				<Route exact path={`${path}/folder/:folderId/edit/:editId`}>
					<MailEditPanel />
				</Route>
			</Switch>
		</Container>
	);
};

export default DetailPanel;
