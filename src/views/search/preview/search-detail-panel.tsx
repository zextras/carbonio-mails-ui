/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Route, Routes, useParams } from 'react-router-dom';

import { SearchConversationPreview } from './conversation-mode/search-conversation-preview';
import { SearchMessagePreview } from './message-mode/search-message-preview';
import { SearchPanelProps } from 'types/index.d';

type WithMessageIdProps = {
	messageId: string;
};

const withMessageId = <P extends WithMessageIdProps>(
	WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, 'messageId'>> => {
	const ComponentWithMessageId = (props: Omit<P, 'messageId'>): React.JSX.Element => {
		const { messageId } = useParams<{ messageId: string }>();
		return <WrappedComponent {...(props as P)} messageId={messageId!} />;
	};

	ComponentWithMessageId.displayName = `withMessageId(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`;

	return ComponentWithMessageId;
};
const SearchDetailPanel = ({ searchResults }: SearchPanelProps): React.JSX.Element => {
	const displayerMessage = useMemo(() => {
		if (searchResults.conversationListIndex.length > 0 || searchResults.messageListIndex.length > 0)
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
	}, [searchResults.conversationListIndex.length, searchResults.messageListIndex.length]);

	const displayerTitle = useMemo(() => displayerMessage?.title, [displayerMessage?.title]);
	const displayerDescription = useMemo(
		() => displayerMessage?.description,
		[displayerMessage?.description]
	);
	return (
		<Routes>
			<Route path={`conversation/:conversationId`} element={<SearchConversationPreview />} />
			<Route path={`message/:messageId`} Component={withMessageId(SearchMessagePreview)}></Route>
			<Route
				path={'/'}
				element={
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
				}
			/>
		</Routes>
	);
};

export default SearchDetailPanel;
