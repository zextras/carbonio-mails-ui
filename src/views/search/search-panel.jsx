/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useRouteMatch, Switch, Route } from 'react-router-dom';
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ConversationPreviewPanel from '../app/detail-panel/conversation-preview-panel';
import MailEditPanel from '../app/detail-panel/mail-edit-panel';
import { EmptyFieldMessages, EmptyListMessages } from './utils';
import MessagePreviewPanel from '../app/detail-panel/message-preview-panel';

const generateRandomNumber = () => Math.floor(Math.random() * 3);
const SearchPanel = ({ searchResults, query }) => {
	const { path } = useRouteMatch();
	const [t] = useTranslation();
	const emptyListMessages = useMemo(() => EmptyListMessages(t), [t]);
	const emptyFieldMessages = useMemo(() => EmptyFieldMessages(t), [t]);
	const [randomIndex, setRandomIndex] = useState(0);
	useEffect(() => {
		const random = generateRandomNumber();
		setRandomIndex(random);
	}, [searchResults?.conversations.length, query]);
	const displayerMessage = useMemo(() => {
		if (searchResults?.conversations.length === 0) {
			return emptyListMessages[randomIndex];
		}
		return emptyFieldMessages[0];
	}, [randomIndex, emptyListMessages, emptyFieldMessages, searchResults?.conversations.length]);
	const displayerTitle = useMemo(() => displayerMessage?.title, [displayerMessage?.title]);
	const displayerDescription = useMemo(
		() => displayerMessage?.description,
		[displayerMessage?.description]
	);
	return (
		<Switch>
			<Route path={`${path}/folder/:folderId/edit/:editId`}>
				<MailEditPanel />
			</Route>
			<Route path={`${path}/folder/:folderId/conversation/:conversationId`}>
				<ConversationPreviewPanel />
			</Route>
			<Route path={`${path}/folder/:folderId/message/:messageId`}>
				<MessagePreviewPanel />
			</Route>
			<Route
				path={path}
				render={() => (
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
				)}
			/>
		</Switch>
	);
};

export default SearchPanel;
