/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { Button, CustomModal, Input, Row } from '@zextras/carbonio-design-system';
import { Folder } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { SelectFolderModal } from 'ui-actions/modals/select-folder-modal';

type MoveToFolderProps = {
	destination?: { name?: string };
	onSelectFolder: () => void;
	onConfirmDestination: (destination: Folder | undefined) => void;
};

export const MovetoFolder = ({
	destination,
	onSelectFolder,
	onConfirmDestination
}: MoveToFolderProps): React.JSX.Element => {
	const [t] = useTranslation();
	const [open, setOpen] = useState(false);

	const onModalClose = useCallback(() => {
		setOpen(false);
	}, []);

	const onInternalSelectFolder = useCallback(() => {
		onSelectFolder();
		setOpen(true);
	}, [onSelectFolder]);

	const onInternalConfirm = useCallback(
		(folder: Folder | undefined) => {
			onConfirmDestination(folder);
			setOpen(false);
		},
		[onConfirmDestination]
	);

	return (
		<>
			{destination?.name !== '' && (
				<Row padding={{ right: 'small' }}>
					<Input
						label={t('label.destination_folder', 'Destination Folder')}
						background="gray5"
						value={destination?.name}
						disabled
					/>
				</Row>
			)}
			<Row>
				<Button
					label={t('settings.browse', 'Browse')}
					type="outlined"
					onClick={onInternalSelectFolder}
				/>
			</Row>

			<CustomModal open={open} onClose={onModalClose} maxHeight="90vh" size="medium">
				<SelectFolderModal
					onClose={onModalClose}
					headerTitle={t('label.choose_folder', 'Choose Folder')}
					actionLabel={t('settings.choose', 'Choose')}
					inputLabel={t('settings.filter_folder_message', 'Select a folder to apply your filter:')}
					confirmAction={onInternalConfirm}
					showSharedAccounts={false}
					showSpamFolder
					showTrashFolder
					allowFolderCreation={false}
					allowRootSelection={false}
				/>
			</CustomModal>
		</>
	);
};
