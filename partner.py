# -*- coding: utf-8 -*-
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2012-2013 Elanz (<http://www.openelanz.fr>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

__author__ = 'vchemiere'

from openerp.osv import osv, fields


class res_partner(osv.osv):
    _inherit = 'res.partner'

    _columns = {

    }

    def write_partner_from_pos(self, cr, uid, cid, cname, cfirstname, cphone, cmobile, cemail, cbirthdate,
                               cbirthlocation, cmaidenname, cstreet, cstreet2, czip, ccity, cis_company, context=None):
        if context is None:
            context = {}
        name = cname
        firstname = cfirstname
        # mise a jour client

        client_id = int(cid)

        if client_id != 0:

            self.write(cr, uid, client_id, {
                'name': name,
                'first_name': firstname,
                'phone': cphone,
                'mobile': cmobile,
                'email': cemail,
                'birth_date': cbirthdate or None,
                'birth_location': cbirthlocation,
                'maiden_name': cmaidenname,
                'street': cstreet,
                'street2': cstreet2,
                'zip': czip,
                'city': ccity,
                'is_company': cis_company,
            }, context=context)
            idClient = client_id

        # creation client
        else:

            idClient = self.create(cr, uid, {
                'name': name,
                'first_name': firstname,
                'phone': cphone,
                'mobile': cmobile,
                'email': cemail,
                'birth_date': cbirthdate or None,
                'birth_location': cbirthlocation,
                'maiden_name': cmaidenname,
                'street': cstreet,
                'street2': cstreet2,
                'zip': czip,
                'city': ccity,
                'is_company': cis_company,
            }, context=context)

        return idClient

    def return_last_pos_order_id(self, cr, uid, cid, context=None):
        res = False
        if cid:
            order_ids = self.pool.get('pos.order').search(cr, uid, [('partner_id', '=', cid)], order="id desc", limit=1)
            for id in order_ids:
                res = id
        return res
