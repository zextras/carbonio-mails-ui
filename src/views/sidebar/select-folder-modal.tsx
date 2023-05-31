/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { isNil, some } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { FolderSelector } from './commons/folder-selector';

type SelectFolderModalProps = {
	folder?: Folder;
	onClose: () => void;
	headerTitle: string;
	actionLabel: string;
	inputLabel: string;
	confirmAction: (
		folder: Folder | undefined,
		setFolder: (_folder: Folder | undefined) => void,
		onClose: () => void
	) => void;
};

export const SelectFolderModal: FC<SelectFolderModalProps> = ({
	folder,
	onClose,
	headerTitle,
	actionLabel,
	inputLabel,
	confirmAction
}) => {
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);

	const onConfirm = useCallback(() => {
		confirmAction(folderDestination, setFolderDestination, onClose);
	}, [confirmAction, folderDestination, onClose]);

	const isInputDisabled = useMemo(
		() =>
			isNil(folderDestination) ||
			folderDestination?.id === folder?.l ||
			some(folderDestination?.children, ['name', folder?.name]),
		[folder?.l, folder?.name, folderDestination]
	);

	const preselectedFolderId = folder && folder.id;

	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader onClose={onClose} title={headerTitle} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
					<Text overflow="break-word">{inputLabel}</Text>
				</Container>
				<FolderSelector
					preselectedFolderId={preselectedFolderId}
					folderDestination={folderDestination}
					setFolderDestination={setFolderDestination}
				/>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={actionLabel}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={isInputDisabled}
				/>
			</Container>
		</Container>
	);
};
