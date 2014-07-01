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
from openerp.addons.point_of_sale import point_of_sale


class pos_order_line(osv.osv):
    _inherit = 'pos.order.line'

    _columns = {
    'weapon_matricule': fields.char('Matricule', size=24),
    }


class pos_order(osv.osv):

	_inherit = 'pos.order'

	def return_pos_order_id(self, cr, uid, args, context):
		return 145


def create_picking2(self, cr, uid, ids, context=None):
    """Create a picking for each order and validate it."""
    picking_obj = self.pool.get('stock.picking.out')
    partner_obj = self.pool.get('res.partner')
    move_obj = self.pool.get('stock.move')
    prodlot_obj = self.pool.get('stock.production.lot')

    for order in self.browse(cr, uid, ids, context=context):
        if not order.state=='draft':
            continue
        addr = order.partner_id and partner_obj.address_get(cr, uid, [order.partner_id.id], ['delivery']) or {}
        picking_id = picking_obj.create(cr, uid, {
            'origin': order.name,
            'partner_id': addr.get('delivery',False),
            'type': 'out',
            'company_id': order.company_id.id,
            'move_type': 'direct',
            'note': order.note or "",
            'invoice_state': 'none',
            'auto_picking': True,
        }, context=context)
        self.write(cr, uid, [order.id], {'picking_id': picking_id}, context=context)
        location_id = order.warehouse_id.lot_stock_id.id
        if order.partner_id:
            destination_id = order.partner_id.property_stock_customer.id
        else:
            destination_id = partner_obj.default_get(cr, uid, ['property_stock_customer'], context=context)['property_stock_customer']

        for line in order.lines:
            if line.product_id and line.product_id.type == 'service':
                continue


            move_vals = {
                'name': line.name,
                'product_uom': line.product_id.uom_id.id,
                'product_uos': line.product_id.uom_id.id,
                'picking_id': picking_id,
                'product_id': line.product_id.id,
                'product_uos_qty': abs(line.qty),
                'product_qty': abs(line.qty),
                'tracking_id': False,
                'state': 'draft',
                'location_id': location_id if line.qty >= 0 else destination_id,
                'location_dest_id': destination_id if line.qty >= 0 else location_id,
            }

            if line.weapon_matricule:
                lot_id = prodlot_obj.create(cr, uid, {'name': line.weapon_matricule, 'product_id': line.product_id.id})
                move_vals.update({'prodlot_id': lot_id})

            move_obj.create(cr, uid,  move_vals, context=context)

        picking_obj.signal_button_confirm(cr, uid, [picking_id])
        picking_obj.force_assign(cr, uid, [picking_id], context)
    return True

point_of_sale.pos_order.create_picking = create_picking2