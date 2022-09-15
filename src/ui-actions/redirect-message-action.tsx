/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useState, useContext, useMemo } from 'react';

import { map, some } from 'lodash';
import {
	Container,
	Text,
	ChipInput,
	Divider,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../views/sidebar/commons/modal-footer';
import { ModalHeader } from '../views/sidebar/commons/modal-header';
import { redirectMessageAction } from '../store/actions';

type RedirectActionProps = { onClose: () => void; id: string };

const getChipLabel = (participant: { fullName?: string; address: string; name?: string }): string =>
	participant.fullName ?? participant.name ?? participant.address;

type ContactType = {
	company?: string;
	email: string;
	firstName?: string;
	fullName?: string;
	id?: string;
	label?: string;
	lastName?: string;
};
const RedirectMessageAction = ({ onClose, id }: RedirectActionProps): ReactElement => {
	const [t] = useTranslation();
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const [contacts, setContacts] = useState<ContactType[]>([]);
	const createSnackbar = useContext(SnackbarManagerContext);
	const onChange = useCallback((users) => setContacts(users), []);
	const disableRedirect = useMemo(() => some(contacts, { error: true }), [contacts]);
	const onConfirm = useCallback(
		() =>
			redirectMessageAction({
				id,
				e: map(contacts, (p) => ({
					a: p.email,
					t: 't'
				}))
			}).then((res) => {
				if (res) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `redirect-${id}`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.message_redirected', 'The message has been redirected'),
						autoHideTimeout: 3000
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `redirect-${id}`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
				onClose();
			}),
		[contacts, createSnackbar, id, t, onClose]
	);

	return (
		<>
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader onClose={onClose} title={t('header.redirect_email', 'Redirect e-mail')} />
				<Container
					padding={{ top: 'small', bottom: 'small' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					<Container>
						<Text overflow="break-word">
							<em>
								{t(
									'messages.modal.redirect.first',
									'This e-mail will be sent on to a new recipient while preserving the e-mail address of the original sender.'
								)}
							</em>
						</Text>
						<br />
						<Text overflow="break-word">
							<em>
								{t(
									'messages.modal.redirect.second',
									'The e-mail will appear as originally intended for the new recepient'
								)}
							</em>
						</Text>

						<Container height="fit" padding={{ top: 'medium' }}>
							{integrationAvailable ? (
								<ContactInput
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									placeholder={t('placeholder.add_new_recipients', 'Add new recipients')}
									onChange={onChange}
									defaultValue={contacts}
									disablePortal
								/>
							) : (
								<ChipInput
									placeholder={t('label.to', 'To')}
									onChange={onChange}
									defaultValue={contacts}
								/>
							)}
						</Container>
						<Divider color="primary" />
						<ModalFooter
							onConfirm={onConfirm}
							label={t('action.redirect', 'Redirect')}
							disabled={disableRedirect}
						/>
					</Container>
				</Container>
			</Container>
		</>
	);
};
export default RedirectMessageAction;
