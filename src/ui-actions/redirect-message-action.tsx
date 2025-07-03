/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Divider, Text } from '@zextras/carbonio-design-system';
import {
	ContactInputItem,
	ModalFooter,
	ModalHeader,
	useContactInput
} from '@zextras/carbonio-ui-commons';
import { map, some } from 'lodash';
import { useTranslation } from 'react-i18next';

import { redirectMessageSoapApi } from 'api/index';
import { TIMEOUTS } from 'constants/index';
import { useUiUtilities } from 'hooks/use-ui-utilities';

type RedirectActionProps = { onClose: () => void; id: string };

const RedirectMessageAction = ({ onClose, id }: RedirectActionProps): ReactElement => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();
	const ContactInput = useContactInput();
	const [contacts, setContacts] = useState<ContactInputItem[]>([]);
	const onContactChange = useCallback((users: ContactInputItem[]) => setContacts(users), []);
	const disableRedirect = useMemo(
		() => contacts?.length === 0 || some(contacts, { error: true }),
		[contacts]
	);

	const onRedirectError = useCallback(() => {
		createSnackbar({
			key: `redirect-${id}`,
			replace: true,
			severity: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: TIMEOUTS.REDIRECT
		});
	}, [createSnackbar, id, t]);

	const onConfirm = useCallback(
		() =>
			redirectMessageSoapApi({
				id,
				e: map(contacts, (p) => ({
					a: p.value.email,
					t: 't'
				}))
			})
				.then((res) => {
					if (!('Fault' in res)) {
						createSnackbar({
							key: `redirect-${id}`,
							replace: true,
							severity: 'success',
							label: t('messages.snackbar.message_redirected', 'The message has been redirected'),
							autoHideTimeout: TIMEOUTS.REDIRECT
						});
						onClose();
					} else {
						onRedirectError();
					}
				})
				.catch(() => {
					onRedirectError();
				}),
		[contacts, createSnackbar, id, onClose, onRedirectError, t]
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
							<ContactInput
								data-testid={'redirect-recipients-address'}
								placeholder={t('placeholder.add_new_recipients', 'Add new recipients')}
								onChange={onContactChange}
								defaultValue={contacts}
							/>
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
