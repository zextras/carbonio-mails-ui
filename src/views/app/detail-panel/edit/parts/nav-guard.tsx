/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState, useMemo, FC, useCallback } from 'react';
import { Prompt, useHistory } from 'react-router-dom';
import { Modal, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../../../../sidebar/commons/modal-footer';

export const RouteLeavingGuard: FC<{ when: boolean; onDeleteDraft: () => void }> = ({
	when,
	onDeleteDraft
}) => {
	const history = useHistory();
	const lastLocationInitial = useMemo<string>(() => history.location.pathname, [history]);
	const [modalVisible, setModalVisible] = useState(false);
	const [lastLocation, setLastLocation] = useState(lastLocationInitial);
	const [confirmedNavigation, setConfirmedNavigation] = useState(false);

	const onDelete = useCallback(() => {
		setModalVisible(false);
		onDeleteDraft();
		setConfirmedNavigation(true);
	}, [onDeleteDraft]);

	const onClose = useCallback(() => {
		setModalVisible(false);
	}, []);

	const onDraft = useCallback(() => {
		setModalVisible(false);
		setConfirmedNavigation(true);
	}, []);

	const handleBlockedNavigation = useCallback(
		(nextLocation) => {
			if (!confirmedNavigation && nextLocation.pathname !== (lastLocation || lastLocationInitial)) {
				setModalVisible(true);
				setLastLocation(nextLocation?.pathname);
				return false;
			}
			return true;
		},
		[confirmedNavigation, lastLocation, lastLocationInitial]
	);
	useEffect(() => {
		if (confirmedNavigation && lastLocation) {
			// Navigate to the previous blocked location with your navigate function
			history.push(lastLocation);
		}
	}, [confirmedNavigation, history, lastLocation]);

	return (
		<>
			<Prompt when={when} message={handleBlockedNavigation} />
			{/* Your own alert/dialog/modal component */}
			<Modal
				open={modalVisible}
				title={t('label.before_you_leave', 'Before you leave')}
				showCloseIcon
				onClose={onClose}
				customFooter={
					<ModalFooter
						secondaryBtnType={'outlined'}
						onConfirm={onDraft}
						label={t('label.keep_draft', 'Keep Draft')}
						secondaryAction={onDelete}
						secondaryLabel={t('label.delete_draft', 'Delete Draft')}
						secondaryColor="primary"
						showDivider={false}
						paddingTop="0"
					/>
				}
			>
				<Padding vertical="medium">
					<Text>
						{t('modal.delete_draft.message1', 'Do you want to keep this draft or delete it?')}
					</Text>
				</Padding>
			</Modal>
		</>
	);
};
