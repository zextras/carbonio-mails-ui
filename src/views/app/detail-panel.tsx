/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useRef, useState, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './detail-panel/conversation-preview-panel-container';
import { MessagePreviewPanelContainer } from './detail-panel/message-preview-panel-container';
import { SelectionInteractive } from './detail-panel/selection-interactive';
import type { AppContext } from '../../types';

const DetailPanel: FC = () => {
	const { path } = useRouteMatch();
	const { count } = useAppContext<AppContext>();
	const [containerWidth, setContainerWidth] = useState('60%');

	useEffect(() => {
		const element = document.getElementById("appContainer");
		if (!element) return;

		const observer = new ResizeObserver(() => {
	      // 👉 Do something when the element is resized
		  setContainerWidth(`calc(100% - ${element.offsetWidth}px)`);
	    });

		observer.observe(element);
		return () => {
			// Cleanup the observer by unobserving all elements
			observer.disconnect();
		};
	}, []);


	return (
		<Container
			data-testid="third-panel"
			width={containerWidth}
			style={{
				maxWidth: '100%',
				minWidth: '30%'
			}}
		>
			<Switch>
				<Route exact path={`${path}/folder/:folderId`}>
					<SelectionInteractive count={count} />
				</Route>
				<Route exact path={`${path}/folder/:folderId/conversation/:conversationId`}>
					<ConversationPreviewPanelContainer />
				</Route>
				<Route exact path={`${path}/folder/:folderId/message/:messageId`}>
					<MessagePreviewPanelContainer />
				</Route>
			</Switch>
		</Container>
	);
};

export default DetailPanel;
