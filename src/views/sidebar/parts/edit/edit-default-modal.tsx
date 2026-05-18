/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	allowedActionOnSharedAccount,
	FolderActionsType,
	FOLDERS,
	isValidFolderName,
	ModalFooter,
	ModalHeader
} from '@zextras/carbonio-ui-commons';
import type { Grant } from '@zextras/carbonio-ui-commons';
import { includes, isEmpty } from 'lodash';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ModalProps } from 'types/utils';
import { RetentionPolicyState } from 'views/sidebar/commons/types';
import { FolderDetails } from 'views/sidebar/parts/edit/folder-details';
import { NameInputRow } from 'views/sidebar/parts/edit/name-input';
import { RetentionPolicies } from 'views/sidebar/parts/edit/retention-policies';
import { ShareFolderProperties } from 'views/sidebar/parts/edit/share-folder-properties';
import { getFolderTranslatedName, useTranslatedSystemFolders } from 'views/sidebar/utils';

const numberRegex = /^\d+$/;
const DAYS_LABEL = 'label.days';
const WEEKS_LABEL = 'label.weeks';
const MONTHS_LABEL = 'label.months';
const YEARS_LABEL = 'label.years';

type MainEditModalProps = ModalProps & {
	grants: Grant[];
	onAddShare: () => void;
	onEditGrant: (grant: Grant) => void;
	onRevokeGrant: (grant: Grant) => void;
};

export const MainEditModal: FC<MainEditModalProps> = ({
	folder,
	onClose,
	grants,
	onAddShare,
	onEditGrant,
	onRevokeGrant
}) => {
	const [folderNameInputValue, setFolderNameInputValue] = useState(folder.name);
	const [folderColor, setFolderColor] = useState<number>(folder.color ?? 0);
	const [retentionState, setRetentionState] = useState<RetentionPolicyState>({
		showPolicy: false,
		dsblMsgDis: false,
		emptyDisValue: false,
		purgeValue: 0,
		dspYear: 'd',
		dspRange: t(DAYS_LABEL, 'Days')
	});

	const updateRetentionState = (partial: Partial<RetentionPolicyState>): void =>
		setRetentionState((prev) => ({ ...prev, ...partial }));

	const { createSnackbar } = useUiUtilities();

	const getRetentionDisplayValues = (
		lifetime: string
	): { dspYear: string; purgeValue: number | string; dspRange: string } => {
		const d = parseInt(lifetime, 10);

		let dspYear = 'd';
		let purgeValue: number | string = d;
		let dspRange = t(DAYS_LABEL, 'Days');

		if (d % 365 === 0) {
			dspYear = 'y';
			purgeValue = d / 365;
			dspRange = t(YEARS_LABEL, 'Years');
		} else if (d % 31 === 0) {
			dspYear = 'm';
			purgeValue = d / 31;
			dspRange = t(MONTHS_LABEL, 'Months');
		} else if (d % 7 === 0) {
			dspYear = 'w';
			purgeValue = d / 7;
			dspRange = t(WEEKS_LABEL, 'Weeks');
		}

		return { dspYear, purgeValue, dspRange };
	};

	useEffect(() => {
		if (
			folder.retentionPolicy &&
			folder.retentionPolicy.length &&
			folder.retentionPolicy[0].purge !== undefined &&
			folder.retentionPolicy[0].purge &&
			Object.keys(folder.retentionPolicy[0].purge[0]).length !== 0
		) {
			const lifetime = folder.retentionPolicy[0]?.purge[0]?.policy[0]?.lifetime;
			const { dspYear, purgeValue, dspRange } = getRetentionDisplayValues(lifetime);

			setRetentionState({
				showPolicy: true,
				dsblMsgDis: true,
				purgeValue,
				dspYear,
				dspRange,
				emptyDisValue: false
			});
		} else {
			setRetentionState({
				showPolicy: false,
				dsblMsgDis: false,
				purgeValue: '',
				dspYear: 'd',
				dspRange: t(DAYS_LABEL, 'Days'),
				emptyDisValue: false
			});
		}
	}, [folder.retentionPolicy, setRetentionState]);

	const isFolderNameInputEmpty = useMemo(
		() => isEmpty(folderNameInputValue),
		[folderNameInputValue]
	);
	const systemFolderNames = useTranslatedSystemFolders();
	const showIsSystemFolderNameWarning = useMemo(
		() =>
			includes(systemFolderNames, folderNameInputValue) ||
			(!isFolderNameInputEmpty && !isValidFolderName(folderNameInputValue)),
		[folderNameInputValue, isFolderNameInputEmpty, systemFolderNames]
	);

	const inpDisable = useMemo(
		() =>
			includes(
				[FOLDERS.INBOX, FOLDERS.TRASH, FOLDERS.SPAM, FOLDERS.SENT, FOLDERS.DRAFTS],
				folder.id
			),
		[folder]
	);

	const disableSubmit = useMemo(
		() => (isFolderNameInputEmpty || showIsSystemFolderNameWarning) && !inpDisable,
		[isFolderNameInputEmpty, showIsSystemFolderNameWarning, inpDisable]
	);

	const calculateLifetimeDays = (value: number, unit: string | null): number => {
		switch (unit) {
			case 'w':
				return value * 7;
			case 'm':
				return value * 31;
			case 'y':
				return value * 365;
			default:
				return value;
		}
	};

	const isRetentionValid = (enabled: boolean, value: number | string): boolean =>
		!enabled || !!(value && numberRegex.test(value.toString()));

	const onConfirm = useCallback(() => {
		const buildRetentionPolicy = (
			enabled: boolean,
			value: number,
			unit: string | null
		): object | undefined => {
			if (!enabled && !folder?.retentionPolicy) return undefined;

			return {
				purge: enabled
					? {
							policy: {
								lifetime: `${calculateLifetimeDays(value, unit)}d`,
								type: 'user'
							}
						}
					: {}
			};
		};

		const { dsblMsgDis, purgeValue, dspYear } = retentionState;

		if (!isRetentionValid(dsblMsgDis, purgeValue)) {
			setRetentionState((prev) => ({ ...prev, emptyDisValue: true }));
			return;
		}

		if (!folderNameInputValue) return;

		const numericValue = Number(purgeValue);
		const retentionPolicy = buildRetentionPolicy(dsblMsgDis, numericValue, dspYear);

		folderActionSoapApi({
			folder: { ...folder, parent: folder.l ?? '', children: [] },
			name: folderNameInputValue,
			op: 'update',
			color: Number(folderColor),
			retentionPolicy
		}).then((res) => {
			const isSuccess = !('Fault' in res);
			createSnackbar({
				key: 'edit',
				replace: true,
				severity: isSuccess ? 'info' : 'error',
				hideButton: true,
				label: isSuccess
					? t('messages.snackbar.folder_edited', 'Changes correctly saved')
					: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
		});

		setFolderNameInputValue('');
		onClose();
	}, [retentionState, folderNameInputValue, folder, folderColor, onClose, createSnackbar]);

	return (
		<>
			<ModalHeader
				onClose={onClose}
				title={t('label.edit_folder_properties', {
					name: getFolderTranslatedName({ folderId: folder.id, folderName: folder.name }),
					defaultValue: 'Edit {{name}} properties'
				})}
			/>

			<NameInputRow
				showWarning={showIsSystemFolderNameWarning}
				setInputValue={setFolderNameInputValue}
				inputValue={folderNameInputValue}
				inpDisable={inpDisable}
				folderColor={folderColor}
				setFolderColor={setFolderColor}
			/>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ top: 'small' }}>
				<FolderDetails folder={folder} />
				{grants.length > 0 && (
					<ShareFolderProperties
						folder={folder}
						grants={grants}
						onEdit={onEditGrant}
						onRevoke={onRevokeGrant}
					/>
				)}
				<RetentionPolicies
					retentionState={retentionState}
					setRetentionState={updateRetentionState}
				/>
			</Container>

			<Container data-testid="edit-folder-footer" height="fit">
				<ModalFooter
					onConfirm={onConfirm}
					label={t('label.edit', 'Edit')}
					secondaryAction={onAddShare}
					secondaryLabel={t('folder.modal.edit.add_share', 'Add Share')}
					disabled={disableSubmit}
					secondaryDisabled={!allowedActionOnSharedAccount(folder, FolderActionsType.SHARE)}
					secondaryBtnType="outlined"
					secondaryColor="primary"
					tooltip={
						disableSubmit
							? t('folder.modal.edit.enter_valid_folder_name', 'Enter a valid folder name')
							: ''
					}
				/>
			</Container>
		</>
	);
};
