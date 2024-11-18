/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useState } from 'react';

import { Button, Container, IconButton, Row, Tooltip } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';

import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import type { Conversation, MailMessage } from '../../../../types';
import { getFolderParentId } from '../../../../ui-actions/utils';
import { ConversationsMultipleSelectionActions } from '../conversations/conversations-multiple-selection-actions';
import { MessagesMultipleSelectionActions } from '../messages/messages-multiple-selection-actions';

type MultipleSelectionActionsPanelProps = {
	items: Array<Partial<MailMessage> & Pick<MailMessage, 'id'>> | Array<Conversation>;
	selectedIds: Array<string>;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
	setIsSelectModeOn: (value: boolean) => void;
	folderId: string;
};

export const MultipleSelectionActionsPanel: FC<MultipleSelectionActionsPanelProps> = ({
	items,
	selectedIds,
	deselectAll,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	setIsSelectModeOn,
	folderId
}) => {
	const { createSnackbar } = useUiUtilities();
	const { zimbraPrefGroupMailBy } = useUserSettings().prefs;
	const isConversation = zimbraPrefGroupMailBy === 'conversation';

	const folderParentId = getFolderParentId({ folderId, isConversation, items });

	const [currentFolderId] = useState(folderParentId);

	// This useEffect is required to reset the select mode when the user navigates to a different folder
	useEffect(() => {
		if (folderId && currentFolderId !== folderParentId) {
			deselectAll();
			setIsSelectModeOn(false);
		}
	}, [currentFolderId, deselectAll, folderId, folderParentId, setIsSelectModeOn]);

	const ids = Object.values(selectedIds ?? []);
	const messagesArrayIsNotEmpty = ids.length > 0;

	const arrowBackOnClick = useCallback(() => {
		deselectAll();
		setIsSelectModeOn(false);
	}, [deselectAll, setIsSelectModeOn]);

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: `selected-${ids}`,
			replace: true,
			severity: 'info',
			label: t('label.all_items_selected', 'All visible items have been selected'),
			autoHideTimeout: 5000,
			hideButton: true
		});
	}, [selectAll, createSnackbar, ids]);

	const iconButtonTooltip = t('label.exit_selection_mode', 'Exit selection mode');

	return (
		<Container
			background={'gray5'}
			height="3rem"
			orientation="horizontal"
			padding={{ all: 'extrasmall' }}
			mainAlignment="flex-start"
			width="100%"
			data-testid={'MultipleSelectionActionPanel'}
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'extrasmall' }}
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row mainAlignment="flex-start" width="fit" padding={{ right: 'medium' }}>
					<Tooltip label={iconButtonTooltip}>
						<IconButton
							icon="ArrowBack"
							iconColor="primary"
							size="large"
							onClick={arrowBackOnClick}
							data-testid="action-button-deselect-all"
						/>
					</Tooltip>
					<Button
						type="ghost"
						label={
							isAllSelected
								? t('label.deselect_all', 'DESELECT all')
								: t('label.select_all', 'SELECT all')
						}
						color="primary"
						onClick={isAllSelected ? selectAllModeOff : selectAllOnClick}
					/>
				</Row>
				{messagesArrayIsNotEmpty && (
					<>
						{isConversation ? (
							<ConversationsMultipleSelectionActions
								ids={selectedIds}
								deselectAll={deselectAll}
								folderId={folderId}
								items={items as Array<Conversation>}
							/>
						) : (
							<MessagesMultipleSelectionActions
								ids={selectedIds}
								deselectAll={deselectAll}
								folderId={folderId}
								items={items as Array<MailMessage>}
							/>
						)}
					</>
				)}
			</Row>
		</Container>
	);
};
