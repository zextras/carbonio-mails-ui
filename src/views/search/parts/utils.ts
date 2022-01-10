/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
const re = /\S+@\S+\.\S+/;

export const isValidEmail = (email: string): boolean => re.test(email);
