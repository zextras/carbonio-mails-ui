/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import React, { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react';

import { nanoid } from '@reduxjs/toolkit';
import { getBridgedFunctions, t } from '@zextras/carbonio-shell-ui';
import { find, includes } from 'lodash';
import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { useAppDispatch } from '../../hooks/redux';
import { createFolder } from '../../store/actions/create-folder';
import type { ModalProps } from '../../types';
import { FolderSelector } from './commons/folder-selector';
import { translatedSystemFolders } from './utils';

export const NewModal: FC<ModalProps> = ({ folder, onClose }) => {
	const dispatch = useAppDispatch();
	const [inputValue, setInputValue] = useState(() => t('new_folder', 'New Folder'));
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState<string>(
		t('folder_panel.modal.new.input.name', 'Enter Folder Name')
	);
	const [errorMsg, setErrorMsg] = useState<string>(
		t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one.')
	);
	const showWarning = useMemo(() => {
		if (includes(translatedSystemFolders(), inputValue)) {
			setErrorMsg(
				t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one.')
			);
			return true;
		}
		if (inputValue && inputValue.includes('/')) {
			setErrorMsg(
				t(
					'folder.modal.edit.special_chars_warning_msg',
					'Special characters are not allowed in the folder name'
				)
			);
			return true;
		}
		return false;
	}, [inputValue]);
	useEffect(() => {
		if (!folderDestination || !inputValue.length || showWarning) {
			setDisabled(true);
			return;
		}
		const value = !!find(folderDestination?.children, (item) => item.name === inputValue);
		if (value) {
			setLabel(t('folder_panel.modal.new.input.name_exist', 'Name already exists in this path'));
		} else {
			setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, showWarning]);

	const onConfirm = useCallback(() => {
		dispatch(
			createFolder({ parentFolder: folderDestination, name: inputValue, id: nanoid() })
		).then((res: unknown & { type: string }) => {
			if (res.type.includes('fulfilled')) {
				getBridgedFunctions()?.createSnackbar({
					key: `edit`,
					replace: true,
					type: 'success',
					label: t('messages.snackbar.folder_created', 'New folder created'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				getBridgedFunctions()?.createSnackbar({
					key: `edit`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
		setInputValue('');
		setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		setFolderDestination(undefined);
		setHasError(false);
		onClose();
	}, [dispatch, folderDestination, inputValue, onClose]);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader
				title={t('folder_panel.modal.new.title', 'Create a new folder')}
				onClose={onClose}
			/>
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Input
					label={label}
					backgroundColor="gray5"
					hasError={hasError || showWarning}
					defaultValue={inputValue}
					onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
				/>
				{showWarning && (
					<Padding all="small">
						<Text size="small" color="error">
							{errorMsg}
						</Text>
					</Padding>
				)}
				<FolderSelector
					folderId={folder.id}
					folderDestination={folderDestination}
					setFolderDestination={setFolderDestination}
				/>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.create', 'Create')}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={disabled}
					tooltip={
						disabled
							? t('folder.modal.edit.enter_valid_folder_name', 'Enter a valid folder name')
							: ''
					}
				/>
			</Container>
		</Container>
	) : (
		<></>
	);
};
