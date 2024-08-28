/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { uniqBy } from 'lodash';

import { EXTRA_WINDOW_ACTION_ID } from '../../../../constants';
import { useCompleteMessage } from '../../../../store/zustand/search/hooks/hooks';
import { MessageAction } from '../../../../types';
import MailPreview from '../../../app/detail-panel/preview/mail-preview';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../search-preview-panel-header';

export type SearchMessagePreviewPanelProps = {
	messageId: string;
	messageActions: Array<MessageAction>;
};

export const SearchMessagePreviewPanel: FC<SearchMessagePreviewPanelProps> = ({
	messageId,
	messageActions
}) => {
	const { isInsideExtraWindow } = useExtraWindow();
	const isExtraWindowActions = messageActions.some(
		(action: MessageAction) => action.id === EXTRA_WINDOW_ACTION_ID
	);
	const actions = isExtraWindowActions
		? messageActions.filter((action: MessageAction) => action.id !== EXTRA_WINDOW_ACTION_ID)
		: uniqBy([...messageActions[0], ...messageActions[1]], 'id');

	const { message } = useCompleteMessage(messageId);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{!isInsideExtraWindow && <SearchPreviewPanelHeader item={message} />}
			{message?.isComplete && (
				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background="gray5"
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
				>
					<Container height="fit" mainAlignment="flex-start" background="gray5">
						<Padding bottom="medium" width="100%">
							<MailPreview
								message={message}
								expanded
								isAlone
								messageActions={actions}
								isMessageView
								isInsideExtraWindow={isInsideExtraWindow}
							/>
						</Padding>
					</Container>
				</Container>
			)}
		</Container>
	);
};
