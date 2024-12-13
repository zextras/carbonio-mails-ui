/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { Button, CustomModal, Input, Row } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { Folder } from '../../../../../carbonio-ui-commons/types/folder';
import { SelectFolderModal } from '../../../../../ui-actions/modals/select-folder-modal';
// TODO: spostare
import { TempAction } from '../filter-action-rows';

type MoveToFolderProps = {
	initialDestinaton: TempAction | undefined;
	onSelectFolder: () => void;
	onConfirmDestination: (destination: Folder | undefined) => void;
};

export const MovetoFolder = ({
	initialDestinaton,
	onSelectFolder,
	onConfirmDestination
}: MoveToFolderProps): React.JSX.Element => {
	const [t] = useTranslation();
	const [open, setOpen] = useState(false);
	const [destination, setDestination] = useState<any>({ name: initialDestinaton?.folderPath });

	const onModalClose = useCallback(() => {
		setDestination({});
		setOpen(false);
	}, [setDestination]);

	const onInternalSelectFolder = useCallback(() => {
		onSelectFolder();
		setOpen(true);
	}, [onSelectFolder]);

	const onInternalConfirm = useCallback(
		(folder: Folder | undefined) => {
			setDestination({ name: folder?.name });
			onConfirmDestination(destination);
			setOpen(false);
		},
		[destination, onConfirmDestination]
	);

	return (
		<>
			{destination && Object.keys(destination).length > 0 && destination?.name !== '' && (
				<Row padding={{ right: 'small' }}>
					<Input
						label={t('label.destination_folder', 'Destination Folder')}
						backgroundColor="gray5"
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
