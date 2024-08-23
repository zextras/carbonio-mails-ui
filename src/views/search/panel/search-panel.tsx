/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useRouteMatch, Switch, Route } from 'react-router-dom';

import { SearchConversationPanel } from './search-conversation-panel';
import { SearchMessagePanel } from './search-message-panel';
import { SearchPanelProps } from '../../../types';

const SearchPanel: FC<SearchPanelProps> = ({ searchResults }) => {
	const { path } = useRouteMatch();

	const displayerMessage = useMemo(() => {
		if (searchResults.conversationIds.size > 0 || searchResults.messageIds.size > 0)
			return {
				title: t(
					'displayer.search_title4',
					'Select one or more results to perform actions or display details.'
				),
				description: ''
			};
		return {
			title: t('displayer.search_title1', 'Start another search'),
			description: t(
				'displayer.search_description1',
				'Or select “Advanced Filters” to refine your search.'
			)
		};
	}, [searchResults.conversationIds.size, searchResults.messageIds.size]);

	const displayerTitle = useMemo(() => displayerMessage?.title, [displayerMessage?.title]);
	const displayerDescription = useMemo(
		() => displayerMessage?.description,
		[displayerMessage?.description]
	);
	return (
		<Switch>
			<Route path={`${path}/conversation/:conversationId`}>
				<SearchConversationPanel />
			</Route>
			<Route path={`${path}/message/:messageId`}>
				<SearchMessagePanel />
			</Route>
			<Route path={path}>
				<Container background="gray5">
					<Padding all="medium">
						<Text
							color="gray1"
							overflow="break-word"
							weight="bold"
							size="large"
							style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
						>
							{displayerTitle}
						</Text>
					</Padding>
					<Text
						size="small"
						color="gray1"
						overflow="break-word"
						style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
					>
						{displayerDescription}
					</Text>
				</Container>
			</Route>
		</Switch>
	);
};

export default SearchPanel;
