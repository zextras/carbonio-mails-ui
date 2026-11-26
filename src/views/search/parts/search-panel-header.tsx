/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactNode, useCallback, useMemo } from 'react';

import { Icon, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useNavigate } from 'react-router-dom';

import { SEARCH_ROUTE } from '../../../constants';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { ReadingPaneHeaderBlock } from 'views/app/detail-panel/preview/parts/reading-pane-header-block';

export const SearchPanelHeader: FC<
	Readonly<{
		item: NormalizedConversation | (Partial<MailMessage> & Pick<MailMessage, 'id'>);
		/** Under the subject, in the same block, starting where the subject starts: the tags. */
		children?: ReactNode;
	}>
> = ({ item, children }) => {
	const navigate = useNavigate();
	const closePanelCallback = useCallback(() => {
		navigate(`/${SEARCH_ROUTE}`, { replace: true });
	}, [navigate]);
	const subject = useMemo(
		() => item?.subject ?? t('label.no_subject_with_tags', '<No Subject>'),
		[item?.subject]
	);

	return (
		<ReadingPaneHeaderBlock
			row={
				<>
					{item?.read ? (
						<Icon
							style={{ width: '1.125rem' }}
							icon="EmailReadOutline"
							data-testid="EmailReadIcon"
						/>
					) : (
						<Icon
							style={{ width: '1.125rem' }}
							icon="EmailReadOutline"
							data-testid="EmailUnreadIcon"
						/>
					)}
					<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
						<Tooltip label={subject}>
							<Text
								size="medium"
								data-testid="Subject"
								color={item?.subject ? 'text' : 'secondary'}
							>
								{subject}
							</Text>
						</Tooltip>
					</Row>
				</>
			}
			onClose={closePanelCallback}
		>
			{children}
		</ReadingPaneHeaderBlock>
	);
};
