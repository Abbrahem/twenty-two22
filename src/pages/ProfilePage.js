import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiShoppingBag, FiCalendar, FiPackage } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <FiUser className="mx-auto text-6xl text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-dark-gray mb-4">يجب تسجيل الدخول أولاً</h2>
            <p className="text-gray-600 mb-8">يرجى تسجيل الدخول للوصول إلى حسابك</p>
            <Link to="/" className="btn-primary">
              العودة للرئيسية
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'delivered':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'قيد المعالجة';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      case 'delivered':
        return 'تم التوصيل';
      default:
        return 'غير محدد';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-gray mb-4">حسابي</h1>
          <p className="text-gray-600">مرحباً بك، {user.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="text-3xl text-black" />
                </div>
                <h2 className="text-xl font-bold text-dark-gray">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>تاريخ الانضمام:</strong> {formatDate(user.createdAt)}</p>
                <p><strong>إجمالي الطلبات:</strong> {user.orders?.length || 0}</p>
              </div>

              <button
                onClick={logout}
                className="w-full mt-6 btn-secondary"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-dark-gray mb-6 flex items-center">
                <FiShoppingBag className="mr-2" />
                طلباتي
              </h2>

              {!user.orders || user.orders.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-dark-gray mb-2">لا توجد طلبات بعد</h3>
                  <p className="text-gray-600 mb-6">لم تقم بأي طلبات حتى الآن</p>
                  <Link to="/products" className="btn-primary">
                    تسوق الآن
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-dark-gray">طلب رقم #{order.id}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <FiCalendar className="mr-1" />
                            {formatDate(order.orderDate)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3 space-x-reverse">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-dark-gray">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                {item.color} • {item.size} • الكمية: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold text-dark-gray">{item.price * item.quantity} جنيه</p>
                          </div>
                        ))}
                      </div>

                      {/* Order Total */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-dark-gray">المجموع الكلي:</span>
                          <span className="font-bold text-gold text-lg">{order.total} جنيه</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
