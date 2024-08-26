/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { uniqBy } from 'lodash';
import { useParams } from 'react-router-dom';

import { API_REQUEST_STATUS, EXTRA_WINDOW_ACTION_ID } from '../../../constants';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { useSelection } from '../../../hooks/use-selection';
import { useCompleteMessage } from '../../../store/zustand/search/hooks/hooks';
import { AppContext, MessageAction } from '../../../types';
import { useMsgConvActions } from '../../../ui-actions/use-msg-conv-actions';
import MailPreview from '../../app/detail-panel/preview/mail-preview';
import { useExtraWindow } from '../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../preview/search-preview-panel-header';

export const SearchMessagePanel: FC = () => {
	const { messageId } = useParams<{ messageId: string }>();
	const { message, messageStatus } = useCompleteMessage(messageId);
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ setCount, count: 0 });

	const messageActionsForExtraWindow = useMessageActions(message, true);
	const messageActions = useMsgConvActions({
		item: message,
		deselectAll,
		messageActionsForExtraWindow
	});
	const { isInsideExtraWindow } = useExtraWindow();
	const isExtraWindowActions = messageActions.some(
		(action: MessageAction) => action.id === EXTRA_WINDOW_ACTION_ID
	);
	const actions = isExtraWindowActions
		? messageActions.filter((action: MessageAction) => action.id !== EXTRA_WINDOW_ACTION_ID)
		: uniqBy([...messageActions[0], ...messageActions[1]], 'id');

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
						{message && messageStatus === API_REQUEST_STATUS.fulfilled && (
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
						)}
						{messageStatus === API_REQUEST_STATUS.pending && (
							<Shimmer.Logo size="large" data-testid={`shimmer-message-${messageId}`} />
						)}
						{(messageStatus === API_REQUEST_STATUS.error || messageStatus === null) && (
							<div data-testid="empty-fragment" />
						)}
					</Container>
				</Container>
			)}
		</Container>
	);
};
