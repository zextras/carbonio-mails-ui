/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { Button, Container, Row, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { useUiUtilities } from 'hooks/use-ui-utilities';

type MultipleSelectionActionsPanelProps = {
	itemsIds: Array<string>;
	selectedIds: Array<string>;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
	setIsSelectModeOn: (value: boolean) => void;
	folderId: string;
	children: React.ReactNode;
};

export const MultipleSelectionActionsPanel = ({
	selectedIds,
	deselectAll,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	setIsSelectModeOn,
	folderId,
	children
}: PropsWithChildren<MultipleSelectionActionsPanelProps>): React.JSX.Element => {
	const { createSnackbar } = useUiUtilities();

	const currentFolder = useRef<string | null>(null);

	// This useEffect is required to reset the select mode when the user navigates to a different folder
	useEffect(() => {
		if (!currentFolder.current) {
			currentFolder.current = folderId;
			return;
		}
		if (currentFolder.current !== folderId) {
			deselectAll();
			setIsSelectModeOn(false);
			currentFolder.current = folderId;
		}
	}, [deselectAll, folderId, setIsSelectModeOn]);

	const arrowBackOnClick = useCallback(() => {
		deselectAll();
		setIsSelectModeOn(false);
	}, [deselectAll, setIsSelectModeOn]);

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: `selected-${selectedIds}`,
			replace: true,
			severity: 'info',
			label: t('label.all_items_selected', 'All visible items have been selected'),
			autoHideTimeout: 5000,
			hideButton: true
		});
	}, [selectAll, createSnackbar, selectedIds]);
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
						<Button
							icon={'ArrowBack'}
							type={'ghost'}
							color={'primary'}
							size={'large'}
							onClick={arrowBackOnClick}
							data-testid={'action-button-deselect-all'}
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
				{selectedIds.length > 0 && children}
			</Row>
		</Container>
	);
};
